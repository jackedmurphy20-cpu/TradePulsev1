import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_URL = 'https://data.alpaca.markets';

// ── Technical Indicators ──────────────────────────────────────────
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calcEMA(closes, period) {
  if (closes.length < period) return closes[closes.length - 1];
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcMACD(closes) {
  if (closes.length < 26) return { macd: 0, signal: 0, hist: 0 };
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macd = ema12 - ema26;
  const macdValues = [];
  for (let i = Math.max(0, closes.length - 35); i <= closes.length - 1; i++) {
    const slice = closes.slice(0, i + 1);
    if (slice.length >= 26) {
      macdValues.push(calcEMA(slice, 12) - calcEMA(slice, 26));
    }
  }
  const signal = macdValues.length >= 9 ? calcEMA(macdValues, 9) : macd;
  return { macd, signal, hist: macd - signal };
}

function calcBollingerBands(closes, period = 20) {
  const slice = closes.slice(-period);
  if (slice.length < period) return { upper: closes[closes.length-1] * 1.02, lower: closes[closes.length-1] * 0.98, mid: closes[closes.length-1] };
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - mid, 2), 0) / period;
  const std = Math.sqrt(variance);
  return { upper: mid + 2 * std, lower: mid - 2 * std, mid };
}

// ── Fetch OHLCV candles from Alpaca ───────────────────────────────
async function fetchCandles(symbol, assetType, headers) {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000);
    const startStr = start.toISOString();
    const endStr = end.toISOString();

    let url;
    if (assetType === 'crypto') {
      const sym = `${symbol}/USD`;
      url = `${ALPACA_DATA_URL}/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=15Min&start=${startStr}&end=${endStr}&limit=200`;
    } else {
      url = `${ALPACA_DATA_URL}/v2/stocks/bars?symbols=${symbol}&timeframe=15Min&start=${startStr}&end=${endStr}&limit=200`;
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    const key = assetType === 'crypto' ? `${symbol}/USD` : symbol;
    const bars = assetType === 'crypto' ? (data.bars?.[key] || []) : (data.bars?.[symbol] || []);
    return bars.map((b) => b.c);
  } catch {
    return [];
  }
}

// ── Strategy Signals ──────────────────────────────────────────────
function signalMomentum(closes) {
  const rsi = calcRSI(closes);
  const { macd, signal } = calcMACD(closes);
  const ema20 = calcEMA(closes, 20);
  const ema50 = calcEMA(closes, 50);
  const price = closes[closes.length - 1];

  const bullish = rsi > 45 && rsi < 70 && macd > signal && price > ema20 && ema20 > ema50;
  const bearish = rsi > 75 || (macd < signal && price < ema20);

  if (bullish) return 'buy';
  if (bearish) return 'sell';
  return 'hold';
}

function signalMeanReversion(closes) {
  const rsi = calcRSI(closes);
  const { upper, lower } = calcBollingerBands(closes);
  const price = closes[closes.length - 1];

  if (rsi < 30 && price < lower) return 'buy';
  if (rsi > 70 && price > upper) return 'sell';
  return 'hold';
}

function signalDCA(_closes) {
  return 'buy';
}

function signalGrid(closes, bot) {
  const price = closes[closes.length - 1];
  const { upper, lower } = calcBollingerBands(closes, 20);
  const gridStep = (upper - lower) / 10;
  const lastTrade = bot.last_trade_price || price;
  if (price < lastTrade - gridStep) return 'buy';
  if (price > lastTrade + gridStep) return 'sell';
  return 'hold';
}

// ── Main Handler ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('ALPACA_API_KEY');
    const apiSecret = Deno.env.get('ALPACA_API_SECRET');
    if (!apiKey || !apiSecret) {
      return Response.json({ error: 'Alpaca API keys not configured' }, { status: 400 });
    }

    const alpacaHeaders = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
      'Content-Type': 'application/json',
    };
    const dataHeaders = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    };

    const [bots, assets] = await Promise.all([
      base44.asServiceRole.entities.TradingBot.filter({ status: 'active' }),
      base44.asServiceRole.entities.Asset.list(),
    ]);

    if (!bots.length) return Response.json({ message: 'No active bots' });

    // Fetch candles for all unique symbols in parallel
    const uniqueSymbols = [...new Set(bots.map((b) => b.asset_symbol))];
    const candleMap = {};
    await Promise.all(
      uniqueSymbols.map(async (sym) => {
        const asset = assets.find((a) => a.symbol === sym);
        const closes = await fetchCandles(sym, asset?.type || 'crypto', dataHeaders);
        candleMap[sym] = closes;
      })
    );

    const results = [];

    for (const bot of bots) {
      const asset = assets.find((a) => a.symbol === bot.asset_symbol);
      if (!asset?.current_price) continue;

      const price = asset.current_price;
      const closes = candleMap[bot.asset_symbol] || [];

      if (closes.length < 20) {
        results.push({ bot: bot.name, action: 'skipped', reason: 'Insufficient candle data' });
        continue;
      }

      const remainingBudget = (bot.budget || 0) - (bot.budget_used || 0);
      let signal = 'hold';

      // Stop loss / take profit override
      if (bot.stop_loss_pct && (bot.total_profit_loss_pct || 0) <= -(bot.stop_loss_pct)) {
        signal = 'sell';
      } else if (bot.take_profit_pct && (bot.total_profit_loss_pct || 0) >= bot.take_profit_pct) {
        signal = 'sell';
      } else {
        switch (bot.strategy) {
          case 'momentum':       signal = signalMomentum(closes); break;
          case 'mean_reversion': signal = signalMeanReversion(closes); break;
          case 'dca':            signal = signalDCA(closes); break;
          case 'grid':           signal = signalGrid(closes, bot); break;
          default:               signal = 'hold';
        }
      }

      // ── BUY ──
      if (signal === 'buy' && remainingBudget >= 1) {
        const tradeAmount = bot.strategy === 'dca'
          ? Math.min(remainingBudget * 0.1, remainingBudget)
          : bot.strategy === 'grid'
          ? Math.min(remainingBudget * 0.05, remainingBudget)
          : Math.min(remainingBudget * 0.15, remainingBudget);

        const qty = tradeAmount / price;
        const orderBody = {
          symbol: asset.type === 'crypto' ? `${bot.asset_symbol}/USD` : bot.asset_symbol,
          qty: qty.toFixed(8),
          side: 'buy',
          type: 'market',
          time_in_force: asset.type === 'crypto' ? 'gtc' : 'day',
        };

        const orderRes = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
          method: 'POST', headers: alpacaHeaders, body: JSON.stringify(orderBody),
        });
        const order = await orderRes.json();

        if (order.id) {
          const holdings = await base44.asServiceRole.entities.Holding.filter({ asset_symbol: bot.asset_symbol });
          const holding = holdings[0];
          if (holding) {
            const newQty = (holding.quantity || 0) + qty;
            const newAvg = ((holding.avg_buy_price || price) * (holding.quantity || 0) + tradeAmount) / newQty;
            await base44.asServiceRole.entities.Holding.update(holding.id, {
              quantity: newQty, avg_buy_price: newAvg, current_price: price,
              total_value: newQty * price,
              profit_loss: (price - newAvg) * newQty,
              profit_loss_pct: ((price - newAvg) / newAvg) * 100,
            });
          } else {
            await base44.asServiceRole.entities.Holding.create({
              asset_symbol: bot.asset_symbol, asset_name: asset.name || bot.asset_symbol,
              quantity: qty, avg_buy_price: price, current_price: price,
              total_value: tradeAmount, profit_loss: 0, profit_loss_pct: 0,
            });
          }

          await base44.asServiceRole.entities.Trade.create({
            bot_id: bot.id, bot_name: bot.name, asset_symbol: bot.asset_symbol,
            type: 'buy', quantity: qty, price, total_value: tradeAmount,
            status: 'executed', rsi: calcRSI(closes), strategy: bot.strategy,
          });

          await base44.asServiceRole.entities.TradingBot.update(bot.id, {
            budget_used: (bot.budget_used || 0) + tradeAmount,
            trade_count: (bot.trade_count || 0) + 1,
            last_trade_price: price, last_signal: 'buy',
            last_run: new Date().toISOString(),
          });

          results.push({ bot: bot.name, action: 'buy', symbol: bot.asset_symbol, amount: tradeAmount, orderId: order.id, rsi: calcRSI(closes) });
        } else {
          results.push({ bot: bot.name, action: 'buy_failed', error: order.message });
        }
      }

      // ── SELL ──
      else if (signal === 'sell') {
        const holdings = await base44.asServiceRole.entities.Holding.filter({ asset_symbol: bot.asset_symbol });
        const holding = holdings[0];
        if (holding && holding.quantity > 0) {
          const qty = holding.quantity;
          const orderBody = {
            symbol: asset.type === 'crypto' ? `${bot.asset_symbol}/USD` : bot.asset_symbol,
            qty: qty.toFixed(8), side: 'sell', type: 'market',
            time_in_force: asset.type === 'crypto' ? 'gtc' : 'day',
          };

          const orderRes = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
            method: 'POST', headers: alpacaHeaders, body: JSON.stringify(orderBody),
          });
          const order = await orderRes.json();

          if (order.id) {
            const pl = (price - (holding.avg_buy_price || price)) * qty;
            await base44.asServiceRole.entities.Trade.create({
              bot_id: bot.id, bot_name: bot.name, asset_symbol: bot.asset_symbol,
              type: 'sell', quantity: qty, price, total_value: qty * price,
              profit_loss: pl, status: 'executed', rsi: calcRSI(closes), strategy: bot.strategy,
            });
            await base44.asServiceRole.entities.Holding.update(holding.id, {
              quantity: 0, total_value: 0, profit_loss: pl,
            });
            const newTotalPL = (bot.total_profit_loss || 0) + pl;
            await base44.asServiceRole.entities.TradingBot.update(bot.id, {
              trade_count: (bot.trade_count || 0) + 1,
              total_profit_loss: newTotalPL,
              total_profit_loss_pct: bot.budget > 0 ? (newTotalPL / bot.budget) * 100 : 0,
              last_trade_price: price, last_signal: 'sell',
              last_run: new Date().toISOString(),
            });
            results.push({ bot: bot.name, action: 'sell', symbol: bot.asset_symbol, qty, pl, orderId: order.id });
          }
        } else {
          await base44.asServiceRole.entities.TradingBot.update(bot.id, { last_signal: 'sell_skipped', last_run: new Date().toISOString() });
          results.push({ bot: bot.name, action: 'hold', reason: 'Sell signal but no holding' });
        }
      }

      // ── HOLD ──
      else {
        await base44.asServiceRole.entities.TradingBot.update(bot.id, { last_signal: 'hold', last_run: new Date().toISOString() });
        results.push({ bot: bot.name, action: 'hold', symbol: bot.asset_symbol, rsi: closes.length >= 14 ? calcRSI(closes) : null });
      }
    }

    return Response.json({ message: `Processed ${bots.length} bots`, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
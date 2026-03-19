import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// --- Technical Indicators ---
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
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcEMA(closes, period) {
  const k = 2 / (period + 1);
  let ema = closes[0];
  for (let i = 1; i < closes.length; i++) ema = closes[i] * k + ema * (1 - k);
  return ema;
}

function calcSMA(closes, period) {
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calcBollinger(closes, period = 20) {
  const sma = calcSMA(closes, period);
  const slice = closes.slice(-period);
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  return { upper: sma + 2 * std, middle: sma, lower: sma - 2 * std };
}

// --- Signal generators per strategy ---
function getSignal(strategy, closes, i) {
  const window = closes.slice(0, i + 1);
  if (window.length < 30) return 'hold';

  if (strategy === 'momentum') {
    const rsi = calcRSI(window);
    const ema12 = calcEMA(window, 12);
    const ema26 = calcEMA(window, 26);
    if (rsi < 35 && ema12 > ema26) return 'buy';
    if (rsi > 65 && ema12 < ema26) return 'sell';
    return 'hold';
  }

  if (strategy === 'mean_reversion') {
    const bb = calcBollinger(window);
    const price = window[window.length - 1];
    if (price < bb.lower) return 'buy';
    if (price > bb.upper) return 'sell';
    return 'hold';
  }

  if (strategy === 'dca') {
    // Buy every N candles regardless
    if (i % 5 === 0) return 'buy';
    return 'hold';
  }

  if (strategy === 'grid') {
    const sma = calcSMA(window, 20);
    const price = window[window.length - 1];
    const pct = (price - sma) / sma;
    if (pct < -0.02) return 'buy';
    if (pct > 0.02) return 'sell';
    return 'hold';
  }

  return 'hold';
}

// --- Fetch candles from Alpaca ---
async function fetchCandles(symbol, assetType, timeframe, startDate, endDate, apiKey, apiSecret) {
  const alpacaBase = assetType === 'crypto'
    ? 'https://data.alpaca.markets/v1beta3/crypto/us/bars'
    : 'https://data.alpaca.markets/v2/stocks/bars';

  const tfMap = { '1d': '1Day', '4h': '4Hour', '1h': '1Hour', '15m': '15Min', '5m': '5Min' };
  const alpacaTf = tfMap[timeframe] || '1Day';

  const params = new URLSearchParams({
    symbols: symbol,
    timeframe: alpacaTf,
    start: startDate,
    end: endDate,
    limit: '1000',
    feed: assetType === 'crypto' ? 'us' : 'iex',
  });

  const url = `${alpacaBase}?${params}`;
  const res = await fetch(url, {
    headers: {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    }
  });

  if (!res.ok) throw new Error(`Alpaca fetch failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const bars = json.bars?.[symbol] || [];
  return bars.map(b => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }));
}

// --- Main handler ---
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { symbol, assetType, strategy, timeframe, startDate, endDate, budget, stopLossType, stopLossValue, takeProfitPct } = await req.json();

    if (!symbol || !strategy || !startDate || !endDate) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ALPACA_API_KEY');
    const apiSecret = Deno.env.get('ALPACA_API_SECRET');

    const candles = await fetchCandles(symbol, assetType || 'stock', timeframe || '1d', startDate, endDate, apiKey, apiSecret);

    if (candles.length < 30) {
      return Response.json({ error: 'Not enough historical data for this range. Try a wider date range.' }, { status: 400 });
    }

    const closes = candles.map(c => c.c);
    const initialBudget = budget || 10000;
    // stopLoss stored as a fraction for % mode, or raw $ amount for usd mode
    const stopLossMode = stopLossType || 'pct';
    const stopLossThreshold = stopLossValue ? (stopLossMode === 'pct' ? stopLossValue / 100 : stopLossValue) : null;
    const takeProfit = takeProfitPct ? takeProfitPct / 100 : null;

    let cash = initialBudget;
    let shares = 0;
    let entryPrice = null;
    let trades = [];
    let equityCurve = [];
    let wins = 0, losses = 0;

    for (let i = 0; i < candles.length; i++) {
      const price = closes[i];
      const signal = getSignal(strategy, closes, i);

      // Check stop-loss / take-profit on open position
      if (shares > 0 && entryPrice) {
        const pct = (price - entryPrice) / entryPrice;
        if (stopLoss && pct <= -stopLoss) {
          const proceeds = shares * price;
          const pl = proceeds - shares * entryPrice;
          trades.push({ date: candles[i].t, type: 'sell', price, shares, pl, reason: 'stop_loss' });
          if (pl >= 0) wins++; else losses++;
          cash += proceeds; shares = 0; entryPrice = null;
        } else if (takeProfit && pct >= takeProfit) {
          const proceeds = shares * price;
          const pl = proceeds - shares * entryPrice;
          trades.push({ date: candles[i].t, type: 'sell', price, shares, pl, reason: 'take_profit' });
          if (pl >= 0) wins++; else losses++;
          cash += proceeds; shares = 0; entryPrice = null;
        }
      }

      // Strategy signal
      if (signal === 'buy' && cash > price) {
        const qty = Math.floor((cash * 0.95) / price);
        if (qty > 0) {
          const cost = qty * price;
          cash -= cost; shares += qty; entryPrice = price;
          trades.push({ date: candles[i].t, type: 'buy', price, shares: qty, pl: 0, reason: 'signal' });
        }
      } else if (signal === 'sell' && shares > 0) {
        const proceeds = shares * price;
        const pl = proceeds - shares * entryPrice;
        trades.push({ date: candles[i].t, type: 'sell', price, shares, pl, reason: 'signal' });
        if (pl >= 0) wins++; else losses++;
        cash += proceeds; shares = 0; entryPrice = null;
      }

      const totalEquity = cash + shares * price;
      equityCurve.push({ date: candles[i].t, value: Math.round(totalEquity * 100) / 100 });
    }

    // Close open position at end
    const finalPrice = closes[closes.length - 1];
    if (shares > 0) {
      const proceeds = shares * finalPrice;
      const pl = proceeds - shares * entryPrice;
      if (pl >= 0) wins++; else losses++;
      cash += proceeds; shares = 0;
    }

    const finalValue = cash;
    const totalReturn = ((finalValue - initialBudget) / initialBudget) * 100;
    const totalTrades = trades.filter(t => t.type === 'sell').length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    // Buy & hold benchmark
    const firstPrice = closes[0];
    const bhShares = initialBudget / firstPrice;
    const bhFinal = bhShares * finalPrice;
    const bhReturn = ((bhFinal - initialBudget) / initialBudget) * 100;

    // Max drawdown
    let peak = initialBudget, maxDrawdown = 0;
    for (const point of equityCurve) {
      if (point.value > peak) peak = point.value;
      const dd = (peak - point.value) / peak * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    return Response.json({
      summary: {
        initialBudget,
        finalValue: Math.round(finalValue * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        totalTrades,
        winRate: Math.round(winRate * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        bhReturn: Math.round(bhReturn * 100) / 100,
      },
      equityCurve,
      trades: trades.slice(-50), // last 50 trades
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
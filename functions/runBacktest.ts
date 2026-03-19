import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// --- Technical Indicators (vectorized, computed once over full array) ---
function calcRSIArray(closes, period = 14) {
  const result = new Array(closes.length).fill(50);
  for (let i = period; i < closes.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

function calcEMAArray(closes, period) {
  const k = 2 / (period + 1);
  const result = new Array(closes.length).fill(closes[0]);
  for (let i = 1; i < closes.length; i++) {
    result[i] = closes[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

function calcSMAArray(closes, period) {
  const result = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    result[i] = sum / period;
  }
  return result;
}

function calcBollingerArrays(closes, period = 20) {
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  const middle = calcSMAArray(closes, period);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = middle[i];
    const variance = slice.reduce((s, v) => s + Math.pow(v - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = sma + 2 * std;
    lower[i] = sma - 2 * std;
  }
  return { upper, lower, middle };
}

// Pre-compute all signals up front
function computeSignals(strategy, closes) {
  const n = closes.length;
  const signals = new Array(n).fill('hold');

  if (strategy === 'momentum') {
    const rsi = calcRSIArray(closes, 14);
    const ema12 = calcEMAArray(closes, 12);
    const ema26 = calcEMAArray(closes, 26);
    for (let i = 26; i < n; i++) {
      if (rsi[i] < 35 && ema12[i] > ema26[i]) signals[i] = 'buy';
      else if (rsi[i] > 65 && ema12[i] < ema26[i]) signals[i] = 'sell';
    }
  } else if (strategy === 'mean_reversion') {
    const { upper, lower } = calcBollingerArrays(closes, 20);
    for (let i = 20; i < n; i++) {
      if (upper[i] && closes[i] < lower[i]) signals[i] = 'buy';
      else if (upper[i] && closes[i] > upper[i]) signals[i] = 'sell';
    }
  } else if (strategy === 'dca') {
    for (let i = 0; i < n; i++) {
      if (i % 5 === 0) signals[i] = 'buy';
    }
  } else if (strategy === 'grid') {
    const sma = calcSMAArray(closes, Math.min(20, n));
    for (let i = 0; i < n; i++) {
      if (!sma[i]) continue;
      const pct = (closes[i] - sma[i]) / sma[i];
      if (pct < -0.02) signals[i] = 'buy';
      else if (pct > 0.02) signals[i] = 'sell';
    }
  }

  return signals;
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

    // Auto-downgrade timeframe for short date ranges
    let tf = timeframe || '1d';
    const daysDiff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 1 && tf === '1d') tf = '15m';
    else if (daysDiff <= 5 && tf === '1d') tf = '1h';

    const candles = await fetchCandles(symbol, assetType || 'stock', tf, startDate, endDate, apiKey, apiSecret);

    if (candles.length < 5) {
      return Response.json({ error: 'Not enough historical data for this range. Try a wider date range or a smaller timeframe.' }, { status: 400 });
    }

    const closes = candles.map(c => c.c);
    const initialBudget = budget || 10000;
    const stopLossMode = stopLossType || 'pct';
    const stopLossThreshold = stopLossValue ? (stopLossMode === 'pct' ? stopLossValue / 100 : stopLossValue) : null;
    const takeProfit = takeProfitPct ? takeProfitPct / 100 : null;

    // Pre-compute all signals at once (efficient)
    const signals = computeSignals(strategy, closes);

    let cash = initialBudget;
    let shares = 0;
    let entryPrice = null;
    let trades = [];
    let equityCurve = [];
    let wins = 0, losses = 0;

    for (let i = 0; i < candles.length; i++) {
      const price = closes[i];
      const signal = signals[i];

      // Check stop-loss / take-profit
      if (shares > 0 && entryPrice) {
        const pct = (price - entryPrice) / entryPrice;
        const slTriggered = stopLossThreshold && (
          stopLossMode === 'pct' ? pct <= -stopLossThreshold : (price - entryPrice) * shares <= -stopLossThreshold
        );
        if (slTriggered) {
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
      cash += proceeds;
    }

    const finalValue = cash;
    const totalReturn = ((finalValue - initialBudget) / initialBudget) * 100;
    const totalTrades = trades.filter(t => t.type === 'sell').length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    const firstPrice = closes[0];
    const bhShares = initialBudget / firstPrice;
    const bhFinal = bhShares * finalPrice;
    const bhReturn = ((bhFinal - initialBudget) / initialBudget) * 100;

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
      trades: trades.slice(-50),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
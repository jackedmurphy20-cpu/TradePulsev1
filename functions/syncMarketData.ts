import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ALPACA_DATA_URL = 'https://data.alpaca.markets';

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

    const headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    };

    const assets = await base44.asServiceRole.entities.Asset.list();
    if (!assets.length) return Response.json({ message: 'No assets to sync' });

    const stocks = assets.filter((a) => a.type === 'stock').map((a) => a.symbol);
    const cryptos = assets.filter((a) => a.type === 'crypto').map((a) => a.symbol);

    const priceMap = {};

    // ── Fetch stock quotes ──
    if (stocks.length > 0) {
      const symbols = stocks.join(',');
      const res = await fetch(`${ALPACA_DATA_URL}/v2/stocks/quotes/latest?symbols=${symbols}`, { headers });
      const data = await res.json();
      const quotes = data.quotes || {};
      for (const symbol of stocks) {
        if (quotes[symbol]) {
          const q = quotes[symbol];
          priceMap[symbol] = (q.ap + q.bp) / 2;
        }
      }
    }

    // ── Fetch crypto quotes ──
    if (cryptos.length > 0) {
      const symbols = cryptos.map((s) => `${s}/USD`).join(',');
      const res = await fetch(`${ALPACA_DATA_URL}/v1beta3/crypto/us/latest/quotes?symbols=${symbols}`, { headers });
      const data = await res.json();
      const quotes = data.quotes || {};
      for (const symbol of cryptos) {
        const key = `${symbol}/USD`;
        if (quotes[key]) {
          const q = quotes[key];
          priceMap[symbol] = (q.ap + q.bp) / 2;
        }
      }
    }

    // ── Update assets ──
    let updatedCount = 0;
    for (const asset of assets) {
      const newPrice = priceMap[asset.symbol];
      if (!newPrice) continue;

      const oldPrice = asset.current_price || newPrice;
      const change24h = ((newPrice - oldPrice) / oldPrice) * 100;
      const sparkline = [...((asset.sparkline || []).slice(-59)), newPrice];

      await base44.asServiceRole.entities.Asset.update(asset.id, {
        current_price: newPrice,
        price_change_24h: change24h,
        sparkline,
        last_synced: new Date().toISOString(),
      });
      updatedCount++;
    }

    // ── Update holdings P&L ──
    const holdings = await base44.asServiceRole.entities.Holding.list();
    for (const holding of holdings) {
      const newPrice = priceMap[holding.asset_symbol];
      if (!newPrice || !holding.quantity) continue;

      const totalValue = holding.quantity * newPrice;
      const pl = (newPrice - (holding.avg_buy_price || newPrice)) * holding.quantity;
      const plPct = holding.avg_buy_price > 0
        ? ((newPrice - holding.avg_buy_price) / holding.avg_buy_price) * 100
        : 0;

      await base44.asServiceRole.entities.Holding.update(holding.id, {
        current_price: newPrice,
        total_value: totalValue,
        profit_loss: pl,
        profit_loss_pct: plPct,
      });
    }

    // ── Snapshot portfolio value for chart ──
    const allHoldings = await base44.asServiceRole.entities.Holding.list();
    const totalValue = allHoldings.reduce((sum, h) => sum + (h.total_value || 0), 0);
    if (totalValue > 0) {
      await base44.asServiceRole.entities.PortfolioSnapshot.create({
        total_value: totalValue,
        timestamp: new Date().toISOString(),
      });
    }

    return Response.json({
      message: `Synced ${updatedCount} assets, ${holdings.length} holdings`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
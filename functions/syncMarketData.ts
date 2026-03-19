import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets';
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
    const headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    };

    // Get all assets from DB
    const assets = await base44.asServiceRole.entities.Asset.list();
    if (!assets.length) return Response.json({ message: 'No assets to sync' });

    const stocks = assets.filter(a => a.type === 'stock').map(a => a.symbol);
    const cryptos = assets.filter(a => a.type === 'crypto').map(a => a.symbol);

    const updates = [];

    // Fetch stock quotes
    if (stocks.length > 0) {
      const symbols = stocks.join(',');
      const res = await fetch(`${ALPACA_DATA_URL}/v2/stocks/quotes/latest?symbols=${symbols}`, { headers });
      const data = await res.json();
      const quotes = data.quotes || {};

      for (const symbol of stocks) {
        if (quotes[symbol]) {
          const q = quotes[symbol];
          const price = (q.ap + q.bp) / 2; // mid price
          updates.push({ symbol, price });
        }
      }
    }

    // Fetch crypto quotes
    if (cryptos.length > 0) {
      const symbols = cryptos.map(s => `${s}/USD`).join(',');
      const res = await fetch(`${ALPACA_DATA_URL}/v1beta3/crypto/us/latest/quotes?symbols=${symbols}`, { headers });
      const data = await res.json();
      const quotes = data.quotes || {};

      for (const symbol of cryptos) {
        const key = `${symbol}/USD`;
        if (quotes[key]) {
          const q = quotes[key];
          const price = (q.ap + q.bp) / 2;
          updates.push({ symbol, price });
        }
      }
    }

    // Update assets in DB
    let updated = 0;
    for (const asset of assets) {
      const upd = updates.find(u => u.symbol === asset.symbol);
      if (upd) {
        const oldPrice = asset.current_price || upd.price;
        const change = ((upd.price - oldPrice) / oldPrice) * 100;
        const sparkline = [...(asset.sparkline || []).slice(-19), upd.price];
        await base44.asServiceRole.entities.Asset.update(asset.id, {
          current_price: upd.price,
          price_change_24h: change,
          sparkline,
        });
        updated++;
      }
    }

    return Response.json({ message: `Synced ${updated} assets`, updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('ALPACA_API_KEY');
    const apiSecret = Deno.env.get('ALPACA_API_SECRET');
    const alpacaHeaders = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
      'Content-Type': 'application/json',
    };

    // Get active bots and assets
    const [bots, assets] = await Promise.all([
      base44.asServiceRole.entities.TradingBot.filter({ status: 'active' }),
      base44.asServiceRole.entities.Asset.list(),
    ]);

    if (!bots.length) return Response.json({ message: 'No active bots' });

    const results = [];

    for (const bot of bots) {
      const asset = assets.find(a => a.symbol === bot.asset_symbol);
      if (!asset || !asset.current_price) continue;

      const price = asset.current_price;
      const remainingBudget = (bot.budget || 0) - (bot.budget_used || 0);
      if (remainingBudget <= 0) continue;

      let shouldBuy = false;
      let shouldSell = false;
      let tradeAmount = 0;

      // Strategy logic
      if (bot.strategy === 'dca') {
        // DCA: always buy a fixed portion
        shouldBuy = true;
        tradeAmount = Math.min(remainingBudget * 0.1, remainingBudget);
      } else if (bot.strategy === 'momentum') {
        // Momentum: buy on positive trend, sell on negative
        const change = asset.price_change_24h || 0;
        if (change > 1) { shouldBuy = true; tradeAmount = Math.min(remainingBudget * 0.15, remainingBudget); }
        else if (change < -2) { shouldSell = true; }
      } else if (bot.strategy === 'mean_reversion') {
        // Mean reversion: buy dips, sell peaks
        const change = asset.price_change_24h || 0;
        if (change < -3) { shouldBuy = true; tradeAmount = Math.min(remainingBudget * 0.2, remainingBudget); }
        else if (change > 4) { shouldSell = true; }
      } else if (bot.strategy === 'grid') {
        // Grid: buy small amounts regularly
        shouldBuy = true;
        tradeAmount = Math.min(remainingBudget * 0.05, remainingBudget);
      }

      // Stop loss / take profit check
      if (bot.stop_loss_pct && bot.total_profit_loss_pct <= -(bot.stop_loss_pct)) {
        shouldSell = true;
        shouldBuy = false;
      }
      if (bot.take_profit_pct && bot.total_profit_loss_pct >= bot.take_profit_pct) {
        shouldSell = true;
        shouldBuy = false;
      }

      if (shouldBuy && tradeAmount >= 1) {
        const qty = tradeAmount / price;
        const side = 'buy';

        // Place paper trade on Alpaca
        const orderBody = {
          symbol: asset.type === 'crypto' ? `${bot.asset_symbol}/USD` : bot.asset_symbol,
          qty: qty.toFixed(8),
          side,
          type: 'market',
          time_in_force: asset.type === 'crypto' ? 'gtc' : 'day',
        };

        const orderRes = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
          method: 'POST',
          headers: alpacaHeaders,
          body: JSON.stringify(orderBody),
        });
        const order = await orderRes.json();

        if (order.id) {
          // Record trade in DB
          await base44.asServiceRole.entities.Trade.create({
            bot_id: bot.id,
            bot_name: bot.name,
            asset_symbol: bot.asset_symbol,
            type: 'buy',
            quantity: qty,
            price,
            total_value: tradeAmount,
            status: 'executed',
          });

          // Update bot stats
          await base44.asServiceRole.entities.TradingBot.update(bot.id, {
            budget_used: (bot.budget_used || 0) + tradeAmount,
            trade_count: (bot.trade_count || 0) + 1,
          });

          results.push({ bot: bot.name, action: 'buy', symbol: bot.asset_symbol, amount: tradeAmount, orderId: order.id });
        } else {
          results.push({ bot: bot.name, action: 'buy_failed', symbol: bot.asset_symbol, error: order.message });
        }
      } else if (shouldSell) {
        // Check if we have a holding
        const holdings = await base44.asServiceRole.entities.Holding.filter({ asset_symbol: bot.asset_symbol });
        const holding = holdings[0];
        if (holding && holding.quantity > 0) {
          const qty = holding.quantity;
          const orderBody = {
            symbol: asset.type === 'crypto' ? `${bot.asset_symbol}/USD` : bot.asset_symbol,
            qty: qty.toFixed(8),
            side: 'sell',
            type: 'market',
            time_in_force: asset.type === 'crypto' ? 'gtc' : 'day',
          };

          const orderRes = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
            method: 'POST',
            headers: alpacaHeaders,
            body: JSON.stringify(orderBody),
          });
          const order = await orderRes.json();

          if (order.id) {
            const pl = (price - holding.avg_buy_price) * qty;
            await base44.asServiceRole.entities.Trade.create({
              bot_id: bot.id,
              bot_name: bot.name,
              asset_symbol: bot.asset_symbol,
              type: 'sell',
              quantity: qty,
              price,
              total_value: qty * price,
              profit_loss: pl,
              status: 'executed',
            });

            await base44.asServiceRole.entities.TradingBot.update(bot.id, {
              trade_count: (bot.trade_count || 0) + 1,
              total_profit_loss: (bot.total_profit_loss || 0) + pl,
            });

            results.push({ bot: bot.name, action: 'sell', symbol: bot.asset_symbol, qty, orderId: order.id });
          }
        }
      }
    }

    return Response.json({ message: `Processed ${bots.length} bots`, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
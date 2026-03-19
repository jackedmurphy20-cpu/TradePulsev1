import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowUpCircle, ArrowDownCircle, Minus, Radio, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function LiveTradeMonitor({ onClose }) {
  const [events, setEvents] = useState([]);
  const [botUpdates, setBotUpdates] = useState({});
  const feedRef = useRef(null);

  useEffect(() => {
    // Subscribe to new trades
    const unsubTrades = base44.entities.Trade.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        const trade = event.data;
        setEvents(prev => [{
          id: event.id + Date.now(),
          kind: 'trade',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          side: trade.type,
          symbol: trade.asset_symbol,
          botName: trade.bot_name,
          qty: trade.quantity,
          price: trade.price,
          value: trade.total_value,
          pl: trade.profit_loss,
        }, ...prev].slice(0, 50);
      }
    });

    // Subscribe to bot signal updates
    const unsubBots = base44.entities.TradingBot.subscribe((event) => {
      if (event.type === 'update' && event.data) {
        const bot = event.data;
        if (bot.last_signal) {
          setBotUpdates(prev => ({
            ...prev,
            [bot.id]: {
              name: bot.name,
              signal: bot.last_signal,
              symbol: bot.asset_symbol,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            }
          }));
        }
      }
    });

    return () => {
      unsubTrades();
      unsubBots();
    };
  }, []);

  // Auto-scroll to top on new events
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [events]);

  const signalColor = (signal) => {
    if (signal === 'buy') return 'text-accent';
    if (signal === 'sell') return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-accent animate-pulse" />
          <span className="text-sm font-semibold text-foreground">Live Trade Monitor</span>
          <Badge className="bg-accent/10 text-accent border-0 text-[10px]">LIVE</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Bot Signal Status */}
      {Object.keys(botUpdates).length > 0 && (
        <div className="px-5 py-3 border-b border-border flex flex-wrap gap-3">
          {Object.values(botUpdates).map((bot, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-secondary rounded-lg px-3 py-1.5">
              <span className="text-muted-foreground">{bot.name}</span>
              <span className="text-muted-foreground">·</span>
              <span className={cn("font-mono font-semibold uppercase", signalColor(bot.signal))}>{bot.signal}</span>
              <span className="text-muted-foreground text-[10px]">{bot.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trade Feed */}
      <div ref={feedRef} className="h-72 overflow-y-auto divide-y divide-border font-mono text-xs">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Radio className="w-8 h-8 opacity-20" />
            <p>Waiting for trades...</p>
            <p className="text-[11px] opacity-60">Trades will appear here in real-time when bots execute</p>
          </div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors animate-slide-up">
              {e.side === 'buy'
                ? <ArrowUpCircle className="w-4 h-4 text-accent flex-shrink-0" />
                : <ArrowDownCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              }
              <span className={cn("font-bold w-8", e.side === 'buy' ? 'text-accent' : 'text-destructive')}>
                {e.side.toUpperCase()}
              </span>
              <span className="text-foreground font-semibold w-16">{e.symbol}</span>
              <span className="text-muted-foreground flex-1">
                {e.qty?.toFixed(6)} @ ${e.price?.toLocaleString()}
              </span>
              <span className="text-foreground w-20 text-right">${e.value?.toLocaleString()}</span>
              {e.pl != null && (
                <span className={cn("w-20 text-right", e.pl >= 0 ? 'text-accent' : 'text-destructive')}>
                  {e.pl >= 0 ? '+' : ''}${e.pl?.toFixed(2)}
                </span>
              )}
              <span className="text-muted-foreground w-16 text-right text-[10px]">{e.time}</span>
              <span className="text-muted-foreground truncate max-w-[100px] text-[10px]">{e.botName}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
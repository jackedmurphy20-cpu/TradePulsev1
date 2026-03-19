import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function Trades() {
  const [filter, setFilter] = useState('all');

  const { data: trades = [] } = useQuery({
    queryKey: ['all-trades'],
    queryFn: () => base44.entities.Trade.list('-created_date', 100),
    initialData: [],
  });

  const filtered = filter === 'all' ? trades : trades.filter(t => t.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Trade History</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete log of all executed trades</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All Trades ({trades.length})</TabsTrigger>
          <TabsTrigger value="buy">Buys ({trades.filter(t => t.type === 'buy').length})</TabsTrigger>
          <TabsTrigger value="sell">Sells ({trades.filter(t => t.type === 'sell').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <div className="w-10" />
          <div className="w-32">Asset</div>
          <div className="w-24">Type</div>
          <div className="flex-1 text-right">Quantity</div>
          <div className="w-28 text-right">Price</div>
          <div className="w-28 text-right">Total</div>
          <div className="w-28 text-right hidden md:block">P&L</div>
          <div className="w-24 text-right hidden lg:block">Status</div>
          <div className="w-32 text-right hidden lg:block">Date</div>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No trades found.
            </div>
          ) : (
            filtered.map(trade => (
              <div key={trade.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  trade.type === 'buy' ? "bg-accent/10" : "bg-destructive/10"
                )}>
                  {trade.type === 'buy' 
                    ? <ArrowDownRight className="w-4 h-4 text-accent" />
                    : <ArrowUpRight className="w-4 h-4 text-destructive" />
                  }
                </div>
                <div className="w-32">
                  <p className="text-sm font-semibold text-foreground">{trade.asset_symbol}</p>
                  <p className="text-xs text-muted-foreground truncate">{trade.bot_name || 'Manual'}</p>
                </div>
                <div className="w-24">
                  <Badge variant="outline" className={cn(
                    "text-[10px] border-0",
                    trade.type === 'buy' ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                  )}>
                    {trade.type?.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex-1 text-right text-sm font-mono text-foreground">
                  {trade.quantity}
                </div>
                <div className="w-28 text-right text-sm font-mono text-muted-foreground">
                  ${trade.price?.toLocaleString()}
                </div>
                <div className="w-28 text-right text-sm font-mono font-medium text-foreground">
                  ${trade.total_value?.toLocaleString()}
                </div>
                <div className="w-28 text-right hidden md:block">
                  {trade.profit_loss !== undefined && trade.profit_loss !== null ? (
                    <span className={cn(
                      "text-sm font-mono",
                      trade.profit_loss >= 0 ? "text-accent" : "text-destructive"
                    )}>
                      {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss?.toFixed(2)}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </div>
                <div className="w-24 text-right hidden lg:block">
                  <Badge variant="outline" className="text-[10px] border-0 bg-secondary text-secondary-foreground">
                    {trade.status?.toUpperCase() || 'EXECUTED'}
                  </Badge>
                </div>
                <div className="w-32 text-right text-xs text-muted-foreground hidden lg:block">
                  {trade.created_date ? format(new Date(trade.created_date), 'MMM d, h:mm a') : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
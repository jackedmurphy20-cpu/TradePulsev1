import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RecentTrades() {
  const { data: trades = [] } = useQuery({
    queryKey: ['recent-trades'],
    queryFn: () => base44.entities.Trade.list('-created_date', 8),
    initialData: [],
  });

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-5 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Recent Trades</h3>
      </div>
      <div className="divide-y divide-border">
        {trades.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No trades yet. Start a bot to begin trading.
          </div>
        ) : (
          trades.map(trade => (
            <div key={trade.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  trade.type === 'buy' ? "bg-accent/10" : "bg-destructive/10"
                )}>
                  {trade.type === 'buy' 
                    ? <ArrowDownRight className="w-4 h-4 text-accent" />
                    : <ArrowUpRight className="w-4 h-4 text-destructive" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{trade.asset_symbol}</p>
                  <p className="text-xs text-muted-foreground">{trade.bot_name || 'Manual'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-medium text-foreground">
                  ${trade.total_value?.toLocaleString()}
                </p>
                <Badge variant="outline" className={cn(
                  "text-[10px] border-0",
                  trade.type === 'buy' ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                )}>
                  {trade.type?.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
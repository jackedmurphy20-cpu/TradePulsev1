import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bot, Play, Pause } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

export default function ActiveBots() {
  const { data: bots = [] } = useQuery({
    queryKey: ['active-bots'],
    queryFn: () => base44.entities.TradingBot.list('-created_date', 5),
    initialData: [],
  });

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Trading Bots</h3>
        <Link to="/bots" className="text-xs text-primary hover:underline">View All</Link>
      </div>
      <div className="divide-y divide-border">
        {bots.length === 0 ? (
          <div className="p-8 text-center">
            <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No bots configured yet</p>
            <Link to="/bots" className="text-xs text-primary hover:underline mt-1 inline-block">Create your first bot</Link>
          </div>
        ) : (
          bots.map(bot => {
            const budgetPct = bot.budget > 0 ? ((bot.budget_used || 0) / bot.budget) * 100 : 0;
            const isProfitable = (bot.total_profit_loss || 0) >= 0;
            return (
              <div key={bot.id} className="px-5 py-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {bot.status === 'active' 
                        ? <Play className="w-3.5 h-3.5 text-accent" />
                        : <Pause className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{bot.name}</p>
                      <p className="text-xs text-muted-foreground">{bot.asset_symbol} · {bot.strategy?.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-mono font-medium",
                      isProfitable ? "text-accent" : "text-destructive"
                    )}>
                      {isProfitable ? '+' : ''}${(bot.total_profit_loss || 0).toFixed(2)}
                    </p>
                    <Badge variant="outline" className={cn(
                      "text-[10px] border-0",
                      bot.status === 'active' ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    )}>
                      {bot.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={budgetPct} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ${(bot.budget_used || 0).toLocaleString()} / ${bot.budget?.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
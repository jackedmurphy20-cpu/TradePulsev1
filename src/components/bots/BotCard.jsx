import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Square, MoreVertical, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const strategyLabels = {
  dca: 'Dollar Cost Avg',
  grid: 'Grid Trading',
  momentum: 'Momentum',
  mean_reversion: 'Mean Reversion',
};

export default function BotCard({ bot }) {
  const queryClient = useQueryClient();
  const isProfitable = (bot.total_profit_loss || 0) >= 0;
  const budgetPct = bot.budget > 0 ? ((bot.budget_used || 0) / bot.budget) * 100 : 0;

  const updateStatus = async (status) => {
    await base44.entities.TradingBot.update(bot.id, { status });
    queryClient.invalidateQueries({ queryKey: ['trading-bots'] });
  };

  const deleteBot = async () => {
    await base44.entities.TradingBot.delete(bot.id);
    queryClient.invalidateQueries({ queryKey: ['trading-bots'] });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            bot.status === 'active' ? "bg-accent/10" : "bg-secondary"
          )}>
            <Zap className={cn(
              "w-5 h-5",
              bot.status === 'active' ? "text-accent" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{bot.name}</h3>
            <p className="text-xs text-muted-foreground">{bot.asset_symbol} · {strategyLabels[bot.strategy] || bot.strategy}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "text-[10px] border-0",
            bot.status === 'active' ? "bg-accent/10 text-accent" : 
            bot.status === 'paused' ? "bg-chart-4/10 text-chart-4" : "bg-muted text-muted-foreground"
          )}>
            {bot.status?.toUpperCase()}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {bot.status !== 'active' && (
                <DropdownMenuItem onClick={() => updateStatus('active')}>
                  <Play className="w-4 h-4 mr-2" /> Start Bot
                </DropdownMenuItem>
              )}
              {bot.status === 'active' && (
                <DropdownMenuItem onClick={() => updateStatus('paused')}>
                  <Pause className="w-4 h-4 mr-2" /> Pause Bot
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => updateStatus('stopped')}>
                <Square className="w-4 h-4 mr-2" /> Stop Bot
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={deleteBot}>
                Delete Bot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* P&L */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Profit / Loss</p>
          <div className="flex items-center gap-2">
            {isProfitable ? <TrendingUp className="w-4 h-4 text-accent" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
            <span className={cn(
              "text-xl font-bold font-mono",
              isProfitable ? "text-accent" : "text-destructive"
            )}>
              {isProfitable ? '+' : ''}${(bot.total_profit_loss || 0).toFixed(2)}
            </span>
            <span className={cn(
              "text-xs font-mono",
              isProfitable ? "text-accent" : "text-destructive"
            )}>
              ({isProfitable ? '+' : ''}{(bot.total_profit_loss_pct || 0).toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{bot.trade_count || 0} trades</p>
          <p className="text-xs text-muted-foreground">Freq: {bot.frequency || '1h'}</p>
        </div>
      </div>

      {/* Budget bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Budget Used</span>
          <span className="font-mono">${(bot.budget_used || 0).toLocaleString()} / ${bot.budget?.toLocaleString()}</span>
        </div>
        <Progress value={budgetPct} className="h-2" />
      </div>

      {/* Risk params */}
      {(bot.stop_loss_pct || bot.take_profit_pct) && (
        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          {bot.stop_loss_pct && (
            <div className="text-xs">
              <span className="text-muted-foreground">Stop Loss:</span>{' '}
              <span className="text-destructive font-mono">{bot.stop_loss_pct}%</span>
            </div>
          )}
          {bot.take_profit_pct && (
            <div className="text-xs">
              <span className="text-muted-foreground">Take Profit:</span>{' '}
              <span className="text-accent font-mono">{bot.take_profit_pct}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
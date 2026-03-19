import React from 'react';
import { TrendingUp, TrendingDown, Target, BarChart2, AlertTriangle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

function Stat({ label, value, sub, color }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-xl font-bold font-mono", color || "text-foreground")}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function BacktestSummary({ summary }) {
  const { initialBudget, finalValue, totalReturn, totalTrades, winRate, maxDrawdown, bhReturn } = summary;
  const profit = finalValue - initialBudget;
  const outperforms = totalReturn > bhReturn;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Results Summary</h2>
        <div className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full",
          outperforms ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
        )}>
          {outperforms ? <Trophy className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {outperforms ? 'Beats Buy & Hold' : 'Underperforms Buy & Hold'}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat
          label="Final Portfolio Value"
          value={`$${finalValue.toLocaleString()}`}
          sub={`Started at $${initialBudget.toLocaleString()}`}
        />
        <Stat
          label="Total Return"
          value={`${totalReturn >= 0 ? '+' : ''}${totalReturn}%`}
          color={totalReturn >= 0 ? 'text-accent' : 'text-destructive'}
          sub={`vs. B&H: ${bhReturn >= 0 ? '+' : ''}${bhReturn}%`}
        />
        <Stat
          label="Net Profit / Loss"
          value={`${profit >= 0 ? '+' : ''}$${Math.abs(profit).toLocaleString()}`}
          color={profit >= 0 ? 'text-accent' : 'text-destructive'}
        />
        <Stat
          label="Total Trades"
          value={totalTrades}
          sub="completed sell orders"
        />
        <Stat
          label="Win Rate"
          value={`${winRate}%`}
          color={winRate >= 50 ? 'text-accent' : 'text-destructive'}
        />
        <Stat
          label="Max Drawdown"
          value={`-${maxDrawdown}%`}
          color={maxDrawdown > 20 ? 'text-destructive' : maxDrawdown > 10 ? 'text-chart-4' : 'text-accent'}
        />
      </div>
    </div>
  );
}
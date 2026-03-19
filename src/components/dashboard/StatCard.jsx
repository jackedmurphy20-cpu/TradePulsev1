import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, changeLabel, icon: Icon, iconColor }) {
  const isPositive = change >= 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-lg", iconColor || "bg-primary/10")}>
          <Icon className={cn("w-4.5 h-4.5", iconColor ? "text-foreground" : "text-primary")} />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            isPositive ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{change?.toFixed(2)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{title}</p>
      {changeLabel && <p className="text-[11px] text-muted-foreground mt-0.5">{changeLabel}</p>}
    </div>
  );
}
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(168, 84%, 49%)', 'hsl(280, 65%, 60%)', 
  'hsl(43, 74%, 66%)', 'hsl(0, 72%, 56%)', 'hsl(200, 70%, 50%)'
];

export default function Portfolio() {
  const { data: holdings = [] } = useQuery({
    queryKey: ['portfolio-holdings'],
    queryFn: () => base44.entities.Holding.list(),
    initialData: [],
  });

  const totalValue = holdings.reduce((sum, h) => sum + (h.total_value || 0), 0);
  const totalPnL = holdings.reduce((sum, h) => sum + (h.profit_loss || 0), 0);
  const isUp = totalPnL >= 0;

  const pieData = holdings.map(h => ({
    name: h.asset_symbol,
    value: h.total_value || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">Your complete holdings overview</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 md:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-3xl font-bold text-foreground mt-1">${totalValue.toLocaleString()}</p>
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm font-medium",
                isUp ? "text-accent" : "text-destructive"
              )}>
                {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isUp ? '+' : ''}${totalPnL.toFixed(2)} total P&L
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => `$${val.toLocaleString()}`}
                  contentStyle={{ 
                    background: 'hsl(222, 47%, 8%)', 
                    border: '1px solid hsl(222, 30%, 16%)', 
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No holdings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Holdings list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <div className="w-48">Asset</div>
          <div className="flex-1 text-right">Quantity</div>
          <div className="w-28 text-right">Avg Price</div>
          <div className="w-28 text-right">Current</div>
          <div className="w-28 text-right">Value</div>
          <div className="w-32 text-right">P&L</div>
        </div>
        <div className="divide-y divide-border">
          {holdings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No holdings yet. Your bot trades will appear here.
            </div>
          ) : (
            holdings.map((h, idx) => {
              const hIsUp = (h.profit_loss || 0) >= 0;
              return (
                <div key={h.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3 w-48">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${COLORS[idx % COLORS.length]}20` }}>
                      <span className="text-xs font-bold" style={{ color: COLORS[idx % COLORS.length] }}>
                        {h.asset_symbol?.slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.asset_symbol}</p>
                      <p className="text-xs text-muted-foreground">{h.asset_name}</p>
                    </div>
                  </div>
                  <div className="flex-1 text-right text-sm font-mono text-foreground">
                    {h.quantity?.toFixed(6)}
                  </div>
                  <div className="w-28 text-right text-sm font-mono text-muted-foreground">
                    ${h.avg_buy_price?.toLocaleString()}
                  </div>
                  <div className="w-28 text-right text-sm font-mono text-foreground">
                    ${h.current_price?.toLocaleString()}
                  </div>
                  <div className="w-28 text-right text-sm font-mono font-medium text-foreground">
                    ${h.total_value?.toLocaleString()}
                  </div>
                  <div className="w-32 text-right">
                    <p className={cn("text-sm font-mono font-medium", hIsUp ? "text-accent" : "text-destructive")}>
                      {hIsUp ? '+' : ''}${(h.profit_loss || 0).toFixed(2)}
                    </p>
                    <Badge variant="outline" className={cn(
                      "text-[10px] border-0",
                      hIsUp ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                    )}>
                      {hIsUp ? '+' : ''}{(h.profit_loss_pct || 0).toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
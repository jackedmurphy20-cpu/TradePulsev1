import React from 'react';
import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BacktestTradeLog({ trades }) {
  const sells = trades.filter(t => t.type === 'sell');

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-base font-semibold text-foreground mb-4">Trade Log <span className="text-muted-foreground font-normal text-sm">(last 50)</span></h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left pb-2 font-medium">Date</th>
              <th className="text-left pb-2 font-medium">Type</th>
              <th className="text-right pb-2 font-medium">Price</th>
              <th className="text-right pb-2 font-medium">Qty</th>
              <th className="text-right pb-2 font-medium">P&L</th>
              <th className="text-right pb-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trades.map((trade, i) => (
              <tr key={i} className="hover:bg-secondary/30 transition-colors">
                <td className="py-2 text-muted-foreground font-mono">
                  {format(new Date(trade.date), 'MMM d, yy')}
                </td>
                <td className="py-2">
                  <div className={cn("flex items-center gap-1 font-semibold", trade.type === 'buy' ? 'text-accent' : 'text-destructive')}>
                    {trade.type === 'buy'
                      ? <ArrowUpCircle className="w-3 h-3" />
                      : <ArrowDownCircle className="w-3 h-3" />
                    }
                    {trade.type.toUpperCase()}
                  </div>
                </td>
                <td className="py-2 text-right font-mono text-foreground">${trade.price?.toLocaleString()}</td>
                <td className="py-2 text-right font-mono text-muted-foreground">{trade.shares}</td>
                <td className={cn("py-2 text-right font-mono font-semibold", trade.pl > 0 ? 'text-accent' : trade.pl < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                  {trade.type === 'sell' ? `${trade.pl >= 0 ? '+' : ''}$${trade.pl?.toFixed(2)}` : '—'}
                </td>
                <td className="py-2 text-right text-muted-foreground capitalize">{trade.reason?.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trades.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No trades executed in this period.</p>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function BacktestTradeLog({ trades, equityCurve }) {
  const handleDownload = () => {
    // Sheet 1: trades
    const tradeRows = [
      ['Date', 'Type', 'Price', 'Quantity', 'P&L', 'Reason'],
      ...trades.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
        t.type,
        t.price,
        t.shares,
        t.type === 'sell' ? t.pl?.toFixed(2) : '',
        t.reason?.replace('_', ' '),
      ])
    ];

    // Sheet 2 (appended with blank separator): equity curve
    const equityRows = [
      [],
      ['--- Equity Curve ---'],
      ['Date', 'Portfolio Value'],
      ...(equityCurve || []).map(p => [
        format(new Date(p.date), 'yyyy-MM-dd HH:mm'),
        p.value,
      ])
    ];

    downloadCSV('backtest_results.csv', [...tradeRows, ...equityRows]);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Trade Log <span className="text-muted-foreground font-normal text-sm">(last 50)</span>
        </h2>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>
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
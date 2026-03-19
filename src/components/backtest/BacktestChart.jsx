import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-primary font-mono font-semibold">${payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

export default function BacktestChart({ equityCurve, initialBudget }) {
  const isPositive = equityCurve[equityCurve.length - 1]?.value >= initialBudget;

  // Downsample for performance if large
  const data = equityCurve.length > 300
    ? equityCurve.filter((_, i) => i % Math.ceil(equityCurve.length / 300) === 0)
    : equityCurve;

  const formatted = data.map(d => ({
    date: format(new Date(d.date), 'MMM d yy'),
    value: d.value,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-base font-semibold text-foreground mb-4">Equity Curve</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bt-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
            strokeWidth={2}
            fill="url(#bt-grad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

function generateChartData(days) {
  const data = [];
  let value = 50000;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value += (Math.random() - 0.45) * value * 0.02;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

const dayMap = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, 'ALL': 730 };

export default function PortfolioChart() {
  const [activeTimeframe, setActiveTimeframe] = useState('1M');
  const data = generateChartData(dayMap[activeTimeframe]);
  const isUp = data.length > 1 && data[data.length - 1].value >= data[0].value;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Portfolio Value</h3>
          <p className="text-2xl font-bold text-foreground mt-1">
            ${data[data.length - 1]?.value?.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                activeTimeframe === tf
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? "hsl(168, 84%, 49%)" : "hsl(0, 72%, 56%)"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isUp ? "hsl(168, 84%, 49%)" : "hsl(0, 72%, 56%)"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} 
              interval="preserveStartEnd"
            />
            <YAxis 
              hide 
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'hsl(222, 47%, 8%)', 
                border: '1px solid hsl(222, 30%, 16%)', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: 'hsl(215, 20%, 55%)' }}
              formatter={(val) => [`$${val.toLocaleString()}`, 'Value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isUp ? "hsl(168, 84%, 49%)" : "hsl(0, 72%, 56%)"}
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
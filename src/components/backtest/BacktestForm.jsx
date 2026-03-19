import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayCircle, Loader2 } from 'lucide-react';

const STRATEGIES = [
  { value: 'momentum', label: 'Momentum (RSI + EMA)' },
  { value: 'mean_reversion', label: 'Mean Reversion (Bollinger)' },
  { value: 'dca', label: 'Dollar Cost Averaging' },
  { value: 'grid', label: 'Grid Trading' },
];

const TIMEFRAMES = [
  { value: '1d', label: '1 Day' },
  { value: '4h', label: '4 Hours' },
  { value: '1h', label: '1 Hour' },
  { value: '15m', label: '15 Minutes' },
];

export default function BacktestForm({ form, onChange, onRun, loading }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <h2 className="text-base font-semibold text-foreground">Configure Backtest</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Asset Symbol</Label>
          <Input
            placeholder="e.g. AAPL, BTC/USD"
            value={form.symbol}
            onChange={e => onChange('symbol', e.target.value.toUpperCase())}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Asset Type</Label>
          <Select value={form.assetType} onValueChange={v => onChange('assetType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Strategy</Label>
          <Select value={form.strategy} onValueChange={v => onChange('strategy', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STRATEGIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Candle Timeframe</Label>
          <Select value={form.timeframe} onValueChange={v => onChange('timeframe', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={form.startDate} onChange={e => onChange('startDate', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input type="date" value={form.endDate} onChange={e => onChange('endDate', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Starting Budget (USD)</Label>
          <Input type="number" value={form.budget} onChange={e => onChange('budget', Number(e.target.value))} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Stop Loss</Label>
            <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onChange('stopLossType', 'pct')}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${form.stopLossType === 'pct' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >%</button>
              <button
                type="button"
                onClick={() => onChange('stopLossType', 'usd')}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${form.stopLossType === 'usd' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >$</button>
            </div>
          </div>
          <Input
            type="number"
            placeholder={form.stopLossType === 'pct' ? 'e.g. 5 (%)' : 'e.g. 500 ($)'}
            value={form.stopLossValue}
            onChange={e => onChange('stopLossValue', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Take Profit %</Label>
          <Input type="number" placeholder="e.g. 10" value={form.takeProfitPct} onChange={e => onChange('takeProfitPct', Number(e.target.value))} />
        </div>
      </div>

      {(() => {
        const days = form.startDate && form.endDate
          ? (new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)
          : null;
        if (days !== null && days <= 5 && form.timeframe === '1d') {
          return (
            <p className="text-xs text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-3 py-2">
              Short date range detected — timeframe will auto-switch to {days <= 1 ? '15m' : '1h'} candles for enough data.
            </p>
          );
        }
        return null;
      })()}

      <Button onClick={onRun} disabled={loading} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
        {loading ? 'Running Backtest...' : 'Run Backtest'}
      </Button>
    </div>
  );
}
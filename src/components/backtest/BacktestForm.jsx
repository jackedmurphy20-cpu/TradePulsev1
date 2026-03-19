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

        <div className="space-y-1.5">
          <Label>Stop Loss %</Label>
          <Input type="number" placeholder="e.g. 5" value={form.stopLossPct} onChange={e => onChange('stopLossPct', Number(e.target.value))} />
        </div>

        <div className="space-y-1.5">
          <Label>Take Profit %</Label>
          <Input type="number" placeholder="e.g. 10" value={form.takeProfitPct} onChange={e => onChange('takeProfitPct', Number(e.target.value))} />
        </div>
      </div>

      <Button onClick={onRun} disabled={loading} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
        {loading ? 'Running Backtest...' : 'Run Backtest'}
      </Button>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const strategies = [
  { value: 'dca', label: 'Dollar Cost Averaging', desc: 'Buy fixed amounts at regular intervals' },
  { value: 'grid', label: 'Grid Trading', desc: 'Place orders at set price intervals' },
  { value: 'momentum', label: 'Momentum', desc: 'Follow price trends and momentum indicators' },
  { value: 'mean_reversion', label: 'Mean Reversion', desc: 'Trade when price deviates from average' },
];

const frequencies = [
  { value: '1m', label: 'Every Minute' },
  { value: '5m', label: 'Every 5 Minutes' },
  { value: '15m', label: 'Every 15 Minutes' },
  { value: '1h', label: 'Hourly' },
  { value: '4h', label: 'Every 4 Hours' },
  { value: '1d', label: 'Daily' },
];

export default function CreateBotDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    asset_symbol: '',
    asset_type: 'crypto',
    strategy: 'dca',
    budget: 1000,
    stop_loss_pct: 5,
    take_profit_pct: 10,
    frequency: '1h',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    setLoading(true);
    await base44.entities.TradingBot.create({
      ...form,
      status: 'paused',
      budget_used: 0,
      total_profit_loss: 0,
      total_profit_loss_pct: 0,
      trade_count: 0,
    });
    queryClient.invalidateQueries({ queryKey: ['trading-bots'] });
    setLoading(false);
    onOpenChange(false);
    setForm({
      name: '', asset_symbol: '', asset_type: 'crypto', strategy: 'dca',
      budget: 1000, stop_loss_pct: 5, take_profit_pct: 10, frequency: '1h',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Create Trading Bot</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Bot Name</Label>
            <Input 
              placeholder="e.g. BTC Accumulator" 
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="bg-secondary"
            />
          </div>

          {/* Asset */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Asset Symbol</Label>
              <Input 
                placeholder="e.g. BTC, AAPL"
                value={form.asset_symbol}
                onChange={(e) => update('asset_symbol', e.target.value.toUpperCase())}
                className="bg-secondary font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={form.asset_type} onValueChange={(v) => update('asset_type', v)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select value={form.strategy} onValueChange={(v) => update('strategy', v)}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                {strategies.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <div>
                      <p>{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label>Budget (USD)</Label>
            <Input 
              type="number"
              value={form.budget}
              onChange={(e) => update('budget', parseFloat(e.target.value) || 0)}
              className="bg-secondary font-mono"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Trading Frequency</Label>
            <Select value={form.frequency} onValueChange={(v) => update('frequency', v)}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                {frequencies.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk Management */}
          <div className="space-y-4 p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk Management</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Stop Loss</Label>
                <span className="text-xs font-mono text-destructive">{form.stop_loss_pct}%</span>
              </div>
              <Slider 
                value={[form.stop_loss_pct]} 
                onValueChange={([v]) => update('stop_loss_pct', v)}
                min={1} max={50} step={1}
                className="[&_[role=slider]]:bg-destructive"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Take Profit</Label>
                <span className="text-xs font-mono text-accent">{form.take_profit_pct}%</span>
              </div>
              <Slider 
                value={[form.take_profit_pct]} 
                onValueChange={([v]) => update('take_profit_pct', v)}
                min={1} max={100} step={1}
                className="[&_[role=slider]]:bg-accent"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleCreate} 
            disabled={!form.name || !form.asset_symbol || loading}
            className="bg-primary"
          >
            {loading ? 'Creating...' : 'Create Bot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
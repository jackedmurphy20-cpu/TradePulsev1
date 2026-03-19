import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Save, Shield, Bell, DollarSign } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    default_budget: 1000,
    max_daily_trades: 50,
    risk_level: 'medium',
    notifications_enabled: true,
    email_alerts: true,
    stop_loss_default: 5,
    take_profit_default: 10,
    auto_reinvest: false,
    preferred_currency: 'USD',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      if (user?.trading_settings) {
        setSettings(prev => ({ ...prev, ...user.trading_settings }));
      }
    })();
  }, []);

  const update = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe({ trading_settings: settings });
    toast.success('Settings saved');
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your trading preferences</p>
      </div>

      {/* Budget & Limits */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Budget & Limits</h2>
        </div>
        
        <div className="space-y-2">
          <Label>Default Bot Budget (USD)</Label>
          <Input 
            type="number" 
            value={settings.default_budget}
            onChange={(e) => update('default_budget', parseFloat(e.target.value) || 0)}
            className="bg-secondary font-mono"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Max Daily Trades per Bot</Label>
          <Input 
            type="number" 
            value={settings.max_daily_trades}
            onChange={(e) => update('max_daily_trades', parseInt(e.target.value) || 0)}
            className="bg-secondary font-mono"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-Reinvest Profits</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Automatically reinvest trading profits</p>
          </div>
          <Switch checked={settings.auto_reinvest} onCheckedChange={(v) => update('auto_reinvest', v)} />
        </div>
      </div>

      {/* Risk Management */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-chart-3" />
          <h2 className="text-base font-semibold text-foreground">Risk Management</h2>
        </div>

        <div className="space-y-2">
          <Label>Risk Level</Label>
          <Select value={settings.risk_level} onValueChange={(v) => update('risk_level', v)}>
            <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low — Conservative</SelectItem>
              <SelectItem value="medium">Medium — Balanced</SelectItem>
              <SelectItem value="high">High — Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Default Stop Loss</Label>
            <span className="text-sm font-mono text-destructive">{settings.stop_loss_default}%</span>
          </div>
          <Slider 
            value={[settings.stop_loss_default]} 
            onValueChange={([v]) => update('stop_loss_default', v)}
            min={1} max={50} step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">Default Take Profit</Label>
            <span className="text-sm font-mono text-accent">{settings.take_profit_default}%</span>
          </div>
          <Slider 
            value={[settings.take_profit_default]} 
            onValueChange={([v]) => update('take_profit_default', v)}
            min={1} max={100} step={1}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-5 h-5 text-chart-4" />
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Push Notifications</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Get notified of trade executions</p>
          </div>
          <Switch checked={settings.notifications_enabled} onCheckedChange={(v) => update('notifications_enabled', v)} />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Email Alerts</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Receive daily portfolio summaries</p>
          </div>
          <Switch checked={settings.email_alerts} onCheckedChange={(v) => update('email_alerts', v)} />
        </div>
      </div>

      {/* Save */}
      <Button onClick={save} disabled={saving} className="bg-primary gap-2 w-full">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
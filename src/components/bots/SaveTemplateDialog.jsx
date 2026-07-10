import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SaveTemplateDialog({ open, onOpenChange, bot }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = async () => {
    setLoading(true);
    await base44.entities.BotTemplate.create({
      name,
      description,
      asset_symbol: bot.asset_symbol,
      asset_type: bot.asset_type,
      strategy: bot.strategy,
      budget: bot.budget,
      stop_loss_pct: bot.stop_loss_pct,
      take_profit_pct: bot.take_profit_pct,
      frequency: bot.frequency,
    });
    queryClient.invalidateQueries({ queryKey: ['bot-templates'] });
    setLoading(false);
    onOpenChange(false);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              placeholder="e.g. Conservative BTC DCA"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="e.g. Low-risk DCA for BTC accumulation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="bg-secondary/50 rounded-lg border border-border p-4 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Will Save</p>
            <p className="text-xs text-muted-foreground">Asset: <span className="text-foreground font-mono">{bot?.asset_symbol}</span></p>
            <p className="text-xs text-muted-foreground">Strategy: <span className="text-foreground">{bot?.strategy}</span></p>
            <p className="text-xs text-muted-foreground">Budget: <span className="text-foreground font-mono">${bot?.budget?.toLocaleString()}</span></p>
            <p className="text-xs text-muted-foreground">Stop Loss: <span className="text-destructive font-mono">{bot?.stop_loss_pct}%</span></p>
            <p className="text-xs text-muted-foreground">Take Profit: <span className="text-accent font-mono">{bot?.take_profit_pct}%</span></p>
            <p className="text-xs text-muted-foreground">Frequency: <span className="text-foreground">{bot?.frequency}</span></p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name || loading} className="bg-primary gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Rocket, Trash2, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const strategyLabels = {
  dca: 'Dollar Cost Avg',
  grid: 'Grid Trading',
  momentum: 'Momentum',
  mean_reversion: 'Mean Reversion',
};

const strategyColors = {
  dca: 'text-chart-4',
  grid: 'text-chart-3',
  momentum: 'text-primary',
  mean_reversion: 'text-accent',
};

export default function TemplateGallery({ onDeploy }) {
  const queryClient = useQueryClient();
  const { data: templates = [] } = useQuery({
    queryKey: ['bot-templates'],
    queryFn: () => base44.entities.BotTemplate.list('-created_date'),
    initialData: [],
  });

  const deleteTemplate = async (id) => {
    await base44.entities.BotTemplate.delete(id);
    queryClient.invalidateQueries({ queryKey: ['bot-templates'] });
  };

  if (templates.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No templates yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Save a bot's settings as a template from its dropdown menu, then deploy new bots instantly from it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {templates.map(tpl => (
        <div key={tpl.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{tpl.name}</h3>
                <p className={cn("text-xs font-medium", strategyColors[tpl.strategy] || "text-muted-foreground")}>
                  {strategyLabels[tpl.strategy] || tpl.strategy}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive" onClick={() => deleteTemplate(tpl.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {tpl.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{tpl.description}</p>
          )}

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs mb-4">
            <div className="text-muted-foreground">Asset: <span className="text-foreground font-mono">{tpl.asset_symbol || 'Any'}</span></div>
            <div className="text-muted-foreground">Budget: <span className="text-foreground font-mono">${tpl.budget?.toLocaleString()}</span></div>
            <div className="text-muted-foreground">Stop Loss: <span className="text-destructive font-mono">{tpl.stop_loss_pct}%</span></div>
            <div className="text-muted-foreground">Take Profit: <span className="text-accent font-mono">{tpl.take_profit_pct}%</span></div>
            <div className="text-muted-foreground">Frequency: <span className="text-foreground">{tpl.frequency}</span></div>
            <div className="text-muted-foreground">Type: <span className="text-foreground capitalize">{tpl.asset_type}</span></div>
          </div>

          <Button onClick={() => onDeploy(tpl)} className="w-full gap-2 mt-auto">
            <Rocket className="w-4 h-4" /> Deploy Bot
          </Button>
        </div>
      ))}
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Bot, Radio, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BotCard from '../components/bots/BotCard';
import CreateBotDialog from '../components/bots/CreateBotDialog';
import LiveTradeMonitor from '../components/bots/LiveTradeMonitor';

export default function Bots() {
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('all');
  const [showMonitor, setShowMonitor] = useState(false);
  const queryClient = useQueryClient();

  const { data: bots = [] } = useQuery({
    queryKey: ['trading-bots'],
    queryFn: () => base44.entities.TradingBot.list('-created_date'),
    initialData: [],
  });

  const deleteBot = async (id) => {
    await base44.entities.TradingBot.delete(id);
    queryClient.invalidateQueries({ queryKey: ['trading-bots'] });
  };

  const filterTabs = ['all', 'active', 'paused', 'stopped'];
  const isFilterTab = filterTabs.includes(tab);

  const filtered = tab === 'all' ? bots : isFilterTab ? bots.filter(b => b.status === tab) : bots;

  const handleTabChange = (val) => {
    if (val === 'setup') {
      setShowCreate(true);
    } else {
      setTab(val);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Trading Bots</h1>
          <p className="text-sm text-muted-foreground mt-1">Automate your trading with custom strategies</p>
        </div>
        <Button onClick={() => setShowMonitor(v => !v)} variant="outline" className="gap-2">
          <Radio className="w-4 h-4 text-accent" /> {showMonitor ? 'Hide Monitor' : 'Live Monitor'}
        </Button>
      </div>

      {showMonitor && <LiveTradeMonitor onClose={() => setShowMonitor(false)} />}

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="bg-secondary flex-wrap h-auto">
          <TabsTrigger value="all">All ({bots.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({bots.filter(b => b.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({bots.filter(b => b.status === 'paused').length})</TabsTrigger>
          <TabsTrigger value="stopped">Stopped ({bots.filter(b => b.status === 'stopped').length})</TabsTrigger>
          <TabsTrigger value="setup" className="text-primary">
            <Plus className="w-3.5 h-3.5 mr-1" /> Set Up Bot
          </TabsTrigger>
          <TabsTrigger value="delete" className="text-destructive">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Bot
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'delete' ? (
        bots.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No bots to delete.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bots.map(bot => (
              <div key={bot.id} className="bg-card border border-destructive/20 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{bot.name}</p>
                    <p className="text-xs text-muted-foreground">{bot.asset_symbol} · {bot.strategy}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-shrink-0 gap-1.5"
                  onClick={() => deleteBot(bot.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No trading bots yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first trading bot to start automating your trades.
          </p>
          <Button onClick={() => setShowCreate(true)} className="bg-primary gap-2">
            <Plus className="w-4 h-4" /> Create Your First Bot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(bot => <BotCard key={bot.id} bot={bot} />)}
        </div>
      )}

      <CreateBotDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Bot, Radio } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BotCard from '../components/bots/BotCard';
import CreateBotDialog from '../components/bots/CreateBotDialog';
import LiveTradeMonitor from '../components/bots/LiveTradeMonitor';

export default function Bots() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showMonitor, setShowMonitor] = useState(false);

  const { data: bots = [] } = useQuery({
    queryKey: ['trading-bots'],
    queryFn: () => base44.entities.TradingBot.list('-created_date'),
    initialData: [],
  });

  const filtered = filter === 'all' ? bots : bots.filter(b => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Trading Bots</h1>
          <p className="text-sm text-muted-foreground mt-1">Automate your trading with custom strategies</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary gap-2">
          <Plus className="w-4 h-4" /> New Bot
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All ({bots.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({bots.filter(b => b.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({bots.filter(b => b.status === 'paused').length})</TabsTrigger>
          <TabsTrigger value="stopped">Stopped ({bots.filter(b => b.status === 'stopped').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No trading bots yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first trading bot to start automating your trades. Set a budget, choose a strategy, and let it work for you.
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
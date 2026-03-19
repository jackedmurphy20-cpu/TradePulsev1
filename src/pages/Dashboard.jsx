import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import StatCard from '../components/dashboard/StatCard';
import PortfolioChart from '../components/dashboard/PortfolioChart';
import RecentTrades from '../components/dashboard/RecentTrades';
import ActiveBots from '../components/dashboard/ActiveBots';
import { Wallet, Bot, ArrowRightLeft, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [running, setRunning] = useState(false);
  const queryClient = useQueryClient();

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke('syncMarketData', {});
      await base44.functions.invoke('runBots', {});
      queryClient.invalidateQueries();
    } finally {
      setRunning(false);
    }
  };
  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings'],
    queryFn: () => base44.entities.Holding.list(),
    initialData: [],
  });

  const { data: bots = [] } = useQuery({
    queryKey: ['bots-count'],
    queryFn: () => base44.entities.TradingBot.list(),
    initialData: [],
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades-count'],
    queryFn: () => base44.entities.Trade.list(),
    initialData: [],
  });

  const totalValue = holdings.reduce((sum, h) => sum + (h.total_value || 0), 0);
  const totalPnL = holdings.reduce((sum, h) => sum + (h.profit_loss || 0), 0);
  const totalPnLPct = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;
  const activeBots = bots.filter(b => b.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor your automated trading portfolio</p>
          </div>
          <Button onClick={handleRunNow} disabled={running} className="gap-2">
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {running ? 'Running...' : 'Run Now'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Portfolio Value"
          value={`$${totalValue.toLocaleString()}`}
          change={totalPnLPct}
          icon={Wallet}
        />
        <StatCard
          title="Total Profit / Loss"
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString()}`}
          change={totalPnLPct}
          icon={TrendingUp}
          iconColor="bg-accent/10"
        />
        <StatCard
          title="Active Bots"
          value={activeBots}
          changeLabel={`${bots.length} total bots`}
          icon={Bot}
          iconColor="bg-chart-3/10"
        />
        <StatCard
          title="Total Trades"
          value={trades.length}
          changeLabel="All time"
          icon={ArrowRightLeft}
          iconColor="bg-chart-4/10"
        />
      </div>

      {/* Chart */}
      <PortfolioChart />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveBots />
        <RecentTrades />
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(168, 84%, 49%)', 'hsl(280, 65%, 60%)',
  'hsl(43, 74%, 66%)', 'hsl(0, 72%, 56%)', 'hsl(200, 70%, 50%)'
];

export default function Portfolio() {
  const queryClient = useQueryClient();
  const [showFunds, setShowFunds] = useState(false);
  const [fundsType, setFundsType] = useState('deposit');
  const [fundsAmount, setFundsAmount] = useState('');
  const [targetBot, setTargetBot] = useState('');
  const [fundsSaving, setFundsSaving] = useState(false);

  const { data: holdings = [] } = useQuery({
    queryKey: ['portfolio-holdings'],
    queryFn: () => base44.entities.Holding.list(),
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: bots = [] } = useQuery({
    queryKey: ['bots-for-portfolio'],
    queryFn: () => base44.entities.TradingBot.list(),
    initialData: [],
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['portfolio-snapshots'],
    queryFn: () => base44.entities.PortfolioSnapshot.list('-timestamp', 48),
    initialData: [],
  });

  const totalValue = holdings.reduce((sum, h) => sum + (h.total_value || 0), 0);
  const totalPnL = holdings.reduce((sum, h) => sum + (h.profit_loss || 0), 0);
  const isUp = totalPnL >= 0;
  const totalBotBudget = bots.reduce((sum, b) => sum + (b.budget || 0), 0);

  const pieData = holdings
    .filter(h => (h.total_value || 0) > 0)
    .map(h => ({ name: h.asset_symbol, value: h.total_value || 0 }));

  const chartData = [...snapshots]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(s => ({
      time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: s.total_value,
    }));

  const handleFunds = async () => {
    const amount = parseFloat(fundsAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setFundsSaving(true);
    try {
      if (targetBot) {
        const bot = bots.find(b => b.id === targetBot);
        if (!bot) throw new Error('Bot not found');
        const newBudget = fundsType === 'deposit'
          ? (bot.budget || 0) + amount
          : Math.max(0, (bot.budget || 0) - amount);
        await base44.entities.TradingBot.update(targetBot, { budget: newBudget });
        queryClient.invalidateQueries({ queryKey: ['bots-for-portfolio'] });
        queryClient.invalidateQueries({ queryKey: ['trading-bots'] });
        toast.success(`${fundsType === 'deposit' ? 'Deposited' : 'Withdrew'} $${amount.toLocaleString()} ${fundsType === 'deposit' ? 'to' : 'from'} ${bot.name}`);
      } else {
        toast.success(`${fundsType === 'deposit' ? 'Deposit' : 'Withdrawal'} of $${amount.toLocaleString()} recorded`);
      }
      setShowFunds(false);
      setFundsAmount('');
      setTargetBot('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setFundsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">Your complete holdings overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFundsType('withdraw'); setShowFunds(true); }} variant="outline" className="gap-2">
            <ArrowDownLeft className="w-4 h-4" /> Withdraw
          </Button>
          <Button onClick={() => { setFundsType('deposit'); setShowFunds(true); }} className="bg-primary gap-2">
            <ArrowUpRight className="w-4 h-4" /> Deposit
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 md:col-span-1">
          <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
          <p className="text-3xl font-bold text-foreground mt-1">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", isUp ? "text-accent" : "text-destructive")}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isUp ? '+' : ''}${totalPnL.toFixed(2)} total P&L
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Total Bot Capital</p>
          <p className="text-3xl font-bold text-foreground mt-1">${totalBotBudget.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">across {bots.length} bots</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `$${val.toLocaleString()}`}
                  contentStyle={{ background: 'hsl(222, 47%, 8%)', border: '1px solid hsl(222, 30%, 16%)', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No holdings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Value Chart */}
      {chartData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Portfolio Value (48h)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickFormatter={(v) => `$${v.toLocaleString()}`} width={70} />
              <Tooltip
                formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Value']}
                contentStyle={{ background: 'hsl(222, 47%, 8%)', border: '1px solid hsl(222, 30%, 16%)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="value" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bot Capital Allocation */}
      {bots.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Bot Capital Allocation</h2>
          </div>
          <div className="divide-y divide-border">
            {bots.map(bot => (
              <div key={bot.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{bot.name}</p>
                  <p className="text-xs text-muted-foreground">{bot.asset_symbol} · {bot.strategy}</p>
                </div>
                <div className="w-32 text-right">
                  <p className="text-sm font-mono text-foreground">${(bot.budget || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">${(bot.budget_used || 0).toFixed(2)} used</p>
                </div>
                <div className="w-20 text-right">
                  <Badge variant="outline" className={cn(
                    "text-[10px] border-0",
                    bot.status === 'active' ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                  )}>
                    {bot.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <div className="w-48">Asset</div>
          <div className="flex-1 text-right">Quantity</div>
          <div className="w-28 text-right">Avg Price</div>
          <div className="w-28 text-right">Current</div>
          <div className="w-28 text-right">Value</div>
          <div className="w-32 text-right">P&L</div>
        </div>
        <div className="divide-y divide-border">
          {holdings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No holdings yet. Bot trades will appear here.
            </div>
          ) : (
            holdings.map((h, idx) => {
              const hIsUp = (h.profit_loss || 0) >= 0;
              return (
                <div key={h.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3 w-48">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${COLORS[idx % COLORS.length]}20` }}>
                      <span className="text-xs font-bold" style={{ color: COLORS[idx % COLORS.length] }}>
                        {h.asset_symbol?.slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.asset_symbol}</p>
                      <p className="text-xs text-muted-foreground">{h.asset_name}</p>
                    </div>
                  </div>
                  <div className="flex-1 text-right text-sm font-mono text-foreground">{h.quantity?.toFixed(6)}</div>
                  <div className="w-28 text-right text-sm font-mono text-muted-foreground">${h.avg_buy_price?.toLocaleString()}</div>
                  <div className="w-28 text-right text-sm font-mono text-foreground">${h.current_price?.toLocaleString()}</div>
                  <div className="w-28 text-right text-sm font-mono font-medium text-foreground">${h.total_value?.toLocaleString()}</div>
                  <div className="w-32 text-right">
                    <p className={cn("text-sm font-mono font-medium", hIsUp ? "text-accent" : "text-destructive")}>
                      {hIsUp ? '+' : ''}${(h.profit_loss || 0).toFixed(2)}
                    </p>
                    <Badge variant="outline" className={cn("text-[10px] border-0", hIsUp ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive")}>
                      {hIsUp ? '+' : ''}{(h.profit_loss_pct || 0).toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Deposit / Withdraw Dialog */}
      <Dialog open={showFunds} onOpenChange={setShowFunds}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {fundsType === 'deposit' ? <ArrowUpRight className="w-5 h-5 text-accent" /> : <ArrowDownLeft className="w-5 h-5 text-destructive" />}
              {fundsType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={fundsAmount}
                onChange={(e) => setFundsAmount(e.target.value)}
                className="bg-secondary font-mono text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Allocate to Bot (optional)</Label>
              <Select value={targetBot} onValueChange={setTargetBot}>
                <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select a bot..." /></SelectTrigger>
                <SelectContent>
                  {bots.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — ${(b.budget || 0).toLocaleString()} budget
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">If selected, adjusts that bot's trading budget directly.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFunds(false)}>Cancel</Button>
            <Button
              onClick={handleFunds}
              disabled={fundsSaving || !fundsAmount}
              className={fundsType === 'deposit' ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : 'bg-destructive hover:bg-destructive/90'}
            >
              {fundsSaving ? 'Processing...' : fundsType === 'deposit' ? 'Deposit' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
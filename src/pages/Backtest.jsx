import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FlaskConical, AlertCircle } from 'lucide-react';
import BacktestForm from '../components/backtest/BacktestForm';
import BacktestSummary from '../components/backtest/BacktestSummary';
import BacktestChart from '../components/backtest/BacktestChart';
import BacktestTradeLog from '../components/backtest/BacktestTradeLog';

const defaultForm = {
  symbol: 'AAPL',
  assetType: 'stock',
  strategy: 'momentum',
  timeframe: '1d',
  startDate: '2023-01-01',
  endDate: '2024-01-01',
  budget: 10000,
  stopLossType: 'pct',
  stopLossValue: '',
  takeProfitPct: '',
};

export default function Backtest() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const onRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('runBacktest', {
        symbol: form.symbol,
        assetType: form.assetType,
        strategy: form.strategy,
        timeframe: form.timeframe,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: form.budget,
        stopLossType: form.stopLossType,
        stopLossValue: form.stopLossValue ? Number(form.stopLossValue) : null,
        takeProfitPct: form.takeProfitPct || null,
      });
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setResult(res.data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-primary" /> Strategy Backtester
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simulate your strategy on historical data before going live
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <BacktestForm form={form} onChange={onChange} onRun={onRun} loading={loading} />
        </div>

        <div className="xl:col-span-2 space-y-6">
          {error && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {!result && !error && !loading && (
            <div className="bg-card border border-border rounded-xl p-16 flex flex-col items-center justify-center text-center gap-3">
              <FlaskConical className="w-12 h-12 text-muted-foreground/20" />
              <p className="text-muted-foreground text-sm">Configure your parameters and run a backtest to see results</p>
            </div>
          )}

          {result && (
            <>
              <BacktestSummary summary={result.summary} />
              <BacktestChart equityCurve={result.equityCurve} initialBudget={result.summary.initialBudget} />
              <BacktestTradeLog trades={result.trades} equityCurve={result.equityCurve} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
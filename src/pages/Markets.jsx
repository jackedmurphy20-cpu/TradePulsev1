import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AssetRow from '../components/markets/AssetRow';

export default function Markets() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: assets = [], isLoading, refetch } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date', 50),
    initialData: [],
  });

  const filtered = assets.filter(a => {
    const matchSearch = a.symbol?.toLowerCase().includes(search.toLowerCase()) || 
                        a.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || 
                        filter === a.type || 
                        (filter === 'watchlist' && a.is_watchlisted);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Markets</h1>
        <p className="text-sm text-muted-foreground mt-1">Track stocks and crypto in real-time</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search assets..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="stock">Stocks</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <div className="w-48">Asset</div>
          <div className="w-24 hidden md:block">7D Chart</div>
          <div className="flex-1 text-right">Price</div>
          <div className="w-20 text-right">24h</div>
          <div className="w-28 text-right hidden lg:block">Market Cap</div>
          <div className="w-28 text-right hidden xl:block">Volume 24h</div>
          <div className="w-8" />
        </div>
        
        {/* Rows */}
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              {isLoading ? 'Loading markets...' : 'No assets found. Add assets to start monitoring.'}
            </div>
          ) : (
            filtered.map(asset => <AssetRow key={asset.id} asset={asset} />)
          )}
        </div>
      </div>
    </div>
  );
}
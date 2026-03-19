import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Star, StarOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function AssetRow({ asset }) {
  const queryClient = useQueryClient();
  const isUp = (asset.price_change_24h || 0) >= 0;
  
  const sparkData = (asset.sparkline || []).map((val, i) => ({ i, v: val }));

  const toggleWatchlist = async (e) => {
    e.stopPropagation();
    await base44.entities.Asset.update(asset.id, { is_watchlisted: !asset.is_watchlisted });
    queryClient.invalidateQueries({ queryKey: ['assets'] });
  };

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group">
      {/* Symbol */}
      <div className="flex items-center gap-3 w-48 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary">{asset.symbol?.slice(0, 3)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{asset.symbol}</p>
          <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
        </div>
      </div>

      {/* Sparkline */}
      <div className="w-24 h-8 hidden md:block">
        {sparkData.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <Area 
                type="monotone" 
                dataKey="v" 
                stroke={isUp ? "hsl(168, 84%, 49%)" : "hsl(0, 72%, 56%)"} 
                strokeWidth={1.5}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Price */}
      <div className="flex-1 text-right">
        <p className="text-sm font-mono font-semibold text-foreground">
          ${asset.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Change */}
      <div className={cn(
        "w-20 text-right text-sm font-mono font-medium",
        isUp ? "text-accent" : "text-destructive"
      )}>
        {isUp ? '+' : ''}{asset.price_change_24h?.toFixed(2)}%
      </div>

      {/* Market Cap */}
      <div className="w-28 text-right hidden lg:block">
        <p className="text-sm font-mono text-muted-foreground">
          ${asset.market_cap ? (asset.market_cap / 1e9).toFixed(1) + 'B' : '—'}
        </p>
      </div>

      {/* Volume */}
      <div className="w-28 text-right hidden xl:block">
        <p className="text-sm font-mono text-muted-foreground">
          ${asset.volume_24h ? (asset.volume_24h / 1e6).toFixed(1) + 'M' : '—'}
        </p>
      </div>

      {/* Watchlist */}
      <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={toggleWatchlist}>
        {asset.is_watchlisted 
          ? <Star className="w-4 h-4 text-chart-4 fill-chart-4" />
          : <StarOff className="w-4 h-4 text-muted-foreground" />
        }
      </Button>
    </div>
  );
}
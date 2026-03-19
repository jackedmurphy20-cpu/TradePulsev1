import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LineChart, Bot, Wallet, History } from 'lucide-react';
import { cn } from "@/lib/utils";

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/markets', label: 'Markets', icon: LineChart },
  { path: '/bots', label: 'Bots', icon: Bot },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/trades', label: 'Trades', icon: History },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border flex">
      {navItems.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
            {label}
            {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}
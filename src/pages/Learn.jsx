import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { BookOpen, TrendingUp, Shield, Bot, BarChart2, ChevronDown, ChevronUp, Lightbulb, AlertTriangle } from 'lucide-react';

const CHART_IMAGES = {
  candlestickAnatomy: 'https://media.base44.com/images/public/69bc59372fd933208db74d78/a0bf8de3c_generated_image.png',
  uptrend: 'https://media.base44.com/images/public/69bc59372fd933208db74d78/99d893b37_generated_image.png',
  patterns: 'https://media.base44.com/images/public/69bc59372fd933208db74d78/f032608b0_generated_image.png',
};

const sections = [
  {
    id: 'basics',
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    thumbnail: 'https://media.base44.com/images/public/69bc59372fd933208db74d78/a3a148491_generated_image.png',
    title: 'The Basics',
    subtitle: 'What are stocks & crypto?',
    lessons: [
      {
        title: 'What is a Stock?',
        emoji: '🏢',
        content: `When a company wants to raise money, it splits itself into millions of tiny pieces called **shares** (or stocks). You can buy those pieces.

If the company does well, your piece becomes worth more. If it does badly, it's worth less.

**Example:** Apple has ~15 billion shares. If you buy 1 share at $200, you own a tiny slice of Apple. If Apple grows and the share hits $250, you made $50.`,
      },
      {
        title: 'What is Crypto?',
        emoji: '🪙',
        content: `Crypto is digital money that no bank or government controls. It runs on a technology called the **blockchain** — basically a public record book that thousands of computers keep simultaneously.

**Bitcoin (BTC)** was the first. There will only ever be 21 million Bitcoin — that scarcity is part of what gives it value.

**Ethereum (ETH)** is like a platform that lets developers build apps on top of it.

Crypto is more volatile than stocks — it can swing 10–20% in a single day.`,
      },
      {
        title: 'How Do Prices Move?',
        emoji: '📈',
        content: `Simple: **supply and demand**.

- More people want to buy → price goes up
- More people want to sell → price goes down

What drives demand? News, earnings reports, hype, fear, interest rates, Twitter (seriously), government regulations, and much more.

**Key insight:** Prices reflect what people *think* something is worth, not always what it actually is. That gap is where traders try to make money.`,
      },
      {
        title: 'Paper Trading vs Live Trading',
        emoji: '🧪',
        content: `**Paper trading** is fake money trading with real market prices. It's like a flight simulator for traders.

TradePulse runs in paper mode by default via Alpaca — all trades are simulated but use real prices.

**Always test in paper mode first.** Even experienced traders backtest and paper trade new strategies before using real money.

Switch to live mode in Settings only when you're confident in your strategy's performance.`,
      },
    ],
  },
  {
    id: 'strategies',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    thumbnail: 'https://media.base44.com/images/public/69bc59372fd933208db74d78/e805c962f_generated_image.png',
    title: 'Trading Strategies',
    subtitle: 'How the bots actually trade',
    lessons: [
      {
        title: 'Dollar Cost Averaging (DCA)',
        emoji: '🗓️',
        content: `The simplest and most beginner-friendly strategy. You buy a fixed dollar amount at regular intervals — no matter what the price is.

**Why it works:** Instead of trying to "buy the dip" perfectly (which almost nobody can do), you average out your purchase price over time.

**Example:** Buy $100 of BTC every week. Sometimes you buy high, sometimes low. Over time, your average cost is somewhere in the middle.

✅ Best for: Long-term accumulation, beginners, crypto
❌ Not for: Short-term profits`,
      },
      {
        title: 'Momentum Trading',
        emoji: '🚀',
        content: `The idea: **things that are going up tend to keep going up** (for a while). Buy when a trend is strong, sell when it weakens.

TradePulse's momentum bot uses:
- **RSI** — measures if something is overbought or oversold
- **MACD** — shows when momentum is shifting
- **EMA crossovers** — short-term average crossing above long-term = bullish signal

**Buy signal:** RSI between 45–70 + MACD crossing up + price above moving averages
**Sell signal:** RSI above 75 (overbought) or MACD crossing down

✅ Best for: Trending markets
❌ Struggles in: Choppy, sideways markets`,
      },
      {
        title: 'Mean Reversion',
        emoji: '🎯',
        content: `The idea: **prices always return to their average**. When something drops too far below normal, it'll bounce back.

TradePulse uses **Bollinger Bands** — a band around the average price. When price touches the lower band + RSI is below 30 (oversold), that's a buy signal.

**Buy signal:** Price below lower Bollinger Band + RSI < 30
**Sell signal:** Price above upper Bollinger Band + RSI > 70

✅ Best for: Range-bound, choppy markets
❌ Struggles in: Strong trending markets (can keep going down)`,
      },
      {
        title: 'Grid Trading',
        emoji: '🔲',
        content: `Imagine placing buy orders every $100 below the current price, and sell orders every $100 above. That's a grid.

You profit from small price swings back and forth — you don't need a big trend.

TradePulse's grid bot uses Bollinger Bands to define the grid range, then buys when price drops a step and sells when it rises a step.

✅ Best for: Sideways/volatile markets, crypto
❌ Not for: Strong trending markets (you'll keep buying a falling asset)`,
      },
    ],
  },
  {
    id: 'indicators',
    icon: BarChart2,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    thumbnail: 'https://media.base44.com/images/public/69bc59372fd933208db74d78/c7ff208e1_generated_image.png',
    title: 'Reading Indicators',
    subtitle: 'RSI, MACD, Bollinger Bands explained simply',
    lessons: [
      {
        title: 'RSI — Relative Strength Index',
        emoji: '📊',
        content: `RSI measures **how fast prices are moving** on a scale of 0–100.

- **Above 70** = Overbought. The asset has risen too fast. Could pull back soon.
- **Below 30** = Oversold. The asset has fallen too fast. Could bounce soon.
- **40–60** = Neutral zone

Think of it like a rubber band — the more it stretches, the more likely it snaps back.

**Tip:** RSI works best in range-bound markets. In a strong trend, RSI can stay "overbought" for a long time.`,
      },
      {
        title: 'MACD — Moving Average Convergence Divergence',
        emoji: '〰️',
        content: `MACD sounds complicated but the idea is simple: it shows **when short-term momentum is stronger or weaker than long-term momentum**.

It's made of two lines:
- **MACD line** = 12-day average minus 26-day average
- **Signal line** = 9-day average of the MACD line

**When MACD crosses above the signal line** → bullish, momentum is picking up → buy signal
**When MACD crosses below the signal line** → bearish, momentum is fading → sell signal

The **histogram** (the bars) shows how far apart the two lines are.`,
      },
      {
        title: 'Bollinger Bands',
        emoji: '📉',
        content: `Bollinger Bands are three lines drawn around a price chart:
- **Middle band** = 20-day moving average (the "normal" price)
- **Upper band** = 2 standard deviations above
- **Lower band** = 2 standard deviations below

About **95% of price action** happens inside the bands. When price breaks outside, something unusual is happening.

**Price touches lower band** → potentially oversold, could bounce → buy signal
**Price touches upper band** → potentially overbought, could pull back → sell signal

**Bands narrow** = low volatility, a big move is coming
**Bands widen** = high volatility, trend is in motion`,
      },
      {
        title: 'Moving Averages (EMA / SMA)',
        emoji: '📐',
        content: `A moving average smooths out price data to show the trend direction.

- **SMA** = average of the last N closing prices
- **EMA** = like SMA but gives more weight to recent prices, so it reacts faster

**Common combos:**
- EMA 12 + EMA 26 → used in MACD
- EMA 50 → medium-term trend
- EMA 200 → long-term trend. Price above EMA 200 = bull market. Below = bear market.

**Golden Cross:** EMA 50 crosses above EMA 200 → strong bullish signal
**Death Cross:** EMA 50 crosses below EMA 200 → strong bearish signal`,
      },
    ],
  },
  {
    id: 'risk',
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    thumbnail: 'https://media.base44.com/images/public/69bc59372fd933208db74d78/c2c36d81d_generated_image.png',
    title: 'Risk Management',
    subtitle: 'How to not blow up your account',
    lessons: [
      {
        title: 'The #1 Rule: Protect Your Capital',
        emoji: '🛡️',
        content: `Most beginners focus on how much they can make. Experienced traders focus on **how much they can lose**.

If you lose 50%, you need to make 100% just to get back to even. Protecting capital is everything.

**The golden rule:** Never risk more than 1–2% of your total capital on a single trade.

If you have $10,000:
- Max risk per trade = $100–200
- Even 10 losing trades in a row only costs you 10–20%`,
      },
      {
        title: 'Stop Loss — Your Safety Net',
        emoji: '🚨',
        content: `A stop loss automatically sells your position if the price falls to a certain level. It caps your downside.

**Example:** You buy BTC at $50,000. You set a stop loss at 5% → $47,500. If BTC drops to $47,500, it auto-sells. You lose $2,500 instead of potentially much more.

In TradePulse, every bot has a **stop loss %** setting. Use it. Always.

**Tip:** Don't set your stop loss too tight (you'll get stopped out by normal volatility) or too loose (you'll take bigger losses than needed). 3–10% is typical depending on the asset's volatility.`,
      },
      {
        title: 'Take Profit — Lock In Gains',
        emoji: '✅',
        content: `Just like stop loss protects your downside, take profit locks in your upside. When the price hits your target, it sells automatically.

**Why not just hold forever?** Because what goes up often comes back down. Locking in a 15% gain beats watching it become a 5% gain.

Set your take profit at a realistic target based on the asset's typical movement range.

**Risk:Reward ratio:** Aim for at least 2:1. If your stop loss is 5%, your take profit should be at least 10%.`,
      },
      {
        title: 'Diversification',
        emoji: '🧺',
        content: `"Don't put all your eggs in one basket."

Spread your capital across multiple assets and strategies. That way one bad trade or one crashing asset doesn't wipe you out.

**Bad:** 100% of capital in 1 memecoin
**Better:** 40% BTC, 30% ETH, 20% stocks, 10% cash reserve

In TradePulse, you can run multiple bots on different assets with different strategies. That's built-in diversification.

Also keep some cash on the sidelines — having dry powder to buy dips is a massive advantage.`,
      },
    ],
  },
  {
    id: 'bots',
    icon: Bot,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    thumbnail: 'https://media.base44.com/images/public/69bc59372fd933208db74d78/c77fef3cf_generated_image.png',
    title: 'Using the Bots',
    subtitle: 'Get the most out of TradePulse',
    lessons: [
      {
        title: 'How TradePulse Bots Work',
        emoji: '⚙️',
        content: `Every 5 minutes, TradePulse automatically:
1. Fetches live prices from Alpaca
2. Pulls 3 days of 15-minute candles for each active bot's asset
3. Calculates RSI, EMA, MACD, Bollinger Bands
4. Generates a buy/sell/hold signal based on your chosen strategy
5. Places the trade on Alpaca (paper or live)
6. Updates your holdings and P&L

You don't need to do anything — just set up your bots and let them run.`,
      },
      {
        title: 'Setting Up Your First Bot',
        emoji: '🤖',
        content: `Go to the **Bots** tab → New Bot. Here's what to set:

1. **Name** — something descriptive like "BTC DCA Bot"
2. **Asset** — the ticker symbol (BTC, ETH, AAPL, etc.)
3. **Strategy** — start with DCA if you're new
4. **Budget** — how much capital to allocate
5. **Stop Loss** — set 5–10% to start
6. **Take Profit** — set 15–20% to start

After creating, **click Activate**. The bot starts trading on the next 5-minute cycle.`,
      },
      {
        title: 'Using the Backtester',
        emoji: '🔬',
        content: `Before running a strategy with real money, test it on historical data first.

Go to the **Backtester** tab, set:
- Symbol and asset type
- Strategy to test
- Date range (at least 6–12 months for meaningful results)
- Budget

It'll show you: total return, win rate, max drawdown, number of trades, and an equity curve chart.

**What to look for:**
- Win rate above 50%
- Max drawdown below 20%
- Consistent equity curve (not just lucky spikes)`,
      },
      {
        title: 'Interpreting Bot Performance',
        emoji: '📋',
        content: `On each Bot Card you'll see:

- **Budget Used** — how much of the budget has been deployed
- **Trade Count** — number of executed trades
- **Total P&L** — profit or loss since the bot started
- **Last Signal** — what the bot decided last cycle (buy/sell/hold)

A bot showing "hold" a lot isn't broken — it means the strategy conditions weren't met. That's normal, especially for momentum and mean reversion strategies.

DCA bots will show "buy" almost every cycle since they accumulate continuously.`,
      },
    ],
  },
];

function LessonCard({ lesson }) {
  const [open, setOpen] = useState(false);

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} className="text-foreground font-semibold">{part}</strong>
              : part
          )}
        </p>
      );
    });
  };

  return (
    <div className={cn("bg-secondary/40 rounded-xl border border-border overflow-hidden transition-all", open && "border-border/80")}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{lesson.emoji}</span>
          <span className="text-sm font-semibold text-foreground">{lesson.title}</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
          {renderContent(lesson.content)}
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const [activeSection, setActiveSection] = useState('basics');
  const current = sections.find(s => s.id === activeSection);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" /> Learn to Trade
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Everything you need to know, explained simply</p>
      </div>

      {/* Beginner tip banner */}
      <div className="flex items-start gap-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4">
        <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">New here?</strong> Start with <strong className="text-foreground">The Basics</strong>, then read up on whichever strategy you want to run. Always backtest before going live.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {sections.map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full flex-shrink-0",
                  isActive ? "bg-card border border-border shadow-sm" : "hover:bg-secondary/50"
                )}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                  <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold truncate", isActive ? "text-foreground" : "text-muted-foreground")}>{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate hidden lg:block">{s.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", current.bg)}>
              <current.icon className={cn("w-5 h-5", current.color)} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{current.title}</h2>
              <p className="text-xs text-muted-foreground">{current.subtitle}</p>
            </div>
          </div>

          {current.lessons.map((lesson, i) => (
            <LessonCard key={i} lesson={lesson} />
          ))}

          {/* Chart reference images */}
          {activeSection === 'indicators' && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" /> Chart Reference Gallery
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl overflow-hidden border border-border">
                  <img src={CHART_IMAGES.candlestickAnatomy} alt="Candlestick Anatomy" className="w-full object-cover" />
                  <p className="text-xs text-center text-muted-foreground py-2 bg-secondary/40">Candlestick Anatomy</p>
                </div>
                <div className="rounded-xl overflow-hidden border border-border">
                  <img src={CHART_IMAGES.uptrend} alt="Uptrend with Indicators" className="w-full object-cover" />
                  <p className="text-xs text-center text-muted-foreground py-2 bg-secondary/40">Uptrend + Support/Resistance</p>
                </div>
                <div className="rounded-xl overflow-hidden border border-border">
                  <img src={CHART_IMAGES.patterns} alt="Chart Patterns" className="w-full object-cover" />
                  <p className="text-xs text-center text-muted-foreground py-2 bg-secondary/40">Common Chart Patterns</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'risk' && (
            <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-xl p-4 mt-4">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Disclaimer:</strong> Trading stocks and cryptocurrency involves significant risk. Never invest money you can't afford to lose. Past performance does not guarantee future results. TradePulse is a tool, not financial advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
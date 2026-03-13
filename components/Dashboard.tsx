'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { processTransfers, ProcessedData, ProcessedTransfer, FPLChip, getWeeklyScore } from '@/lib/fpl';
import { TransferCard } from '@/components/TransferCard';
import { PointsChart } from '@/components/PointsChart';
import { TransferTimeline } from '@/components/TransferTimeline';
import { Loader2, Search, AlertCircle, Zap, ArrowLeft, BarChart3, List } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export function Dashboard({ initialTeamId, initialLeagueId }: { initialTeamId?: string; initialLeagueId?: string }) {
  const [teamId, setTeamId] = useState(initialTeamId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ProcessedData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'transfers' | 'charts'>('transfers');

  const fetchData = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setTeamId(trimmed);
    setLoading(true);
    setError('');
    setData(null);
    try {
      const result = await processTransfers(parseInt(trimmed, 10));
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch transfers. Please check your Team ID and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTeamId) fetchData(initialTeamId);
  }, [initialTeamId, fetchData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(teamId);
  };

  const horsePuns = useMemo(() => [
    "Why check transfers when you could just bet on the horses instead?",
    "Quit horsing around with your FPL team and head to the bookies.",
    "Your transfer strategy has less direction than a horse in a roundabout.",
    "Neigh-ver gonna give you points, neigh-ver gonna let you win.",
    "Saddling up bad transfers since GW1 — a true stallion of mediocrity.",
    "Hold your horses… actually, just sell your whole team.",
    "Your midfield has less horsepower than a Shetland pony.",
    "Stop flogging a dead horse and just wildcard already.",
    "Mane attraction? More like mane disappointment this season.",
    "Unbridled chaos — that's what your transfer history looks like.",
    "You're putting the cart before the horse — bench boost before you fix your squad.",
    "These transfers are so bad, even a horse wouldn't back them.",
    "Galloping from one bad pick to another — truly a thoroughbred of pain.",
    "Hay, at least your transfers give the rest of the league a laugh.",
    "Jockey for position all you want, you're still finishing last.",
    "Your captaincy picks have been a real night-mare.",
    "Reining in points? More like reining in disappointment.",
    "A horse walks into a bar. The bartender asks, 'Why the long FPL season?'",
    "Stirrup some controversy with these shocking transfers.",
    "Stable genius? Your FPL rank says otherwise.",
  ], []);

  const horsePun = useMemo(
    () => horsePuns[Math.floor(Math.random() * horsePuns.length)],
    [horsePuns]
  );

  const egoPuns = useMemo(() => [
    { text: "Save yourself the analysis — just copy {link}.", hasLink: true },
    { text: "Your transfers are cute. Want to see how a real manager does it? Check {link}.", hasLink: true },
    { text: "I'd explain my strategy, but you wouldn't understand the vision.", hasLink: false },
    { text: "Pro tip: whatever you're about to do, do the opposite. Or just copy {link}.", hasLink: true },
    { text: "Step 1: Look at your team. Step 2: Look at {link}. Step 3: Accept reality.", hasLink: true },
    { text: "They call me the Oracle of FPL. You can call me your {link}.", hasLink: true },
    { text: "I don't always make transfers, but when I do, they're masterclass. Unlike yours.", hasLink: false },
    { text: "Forgetting to set your team is not a strategy. Or is it? No. No it isn't.", hasLink: false },
    { text: "Is a goalkeeper a defender? Is water wet? These are the questions you should be asking instead of making transfers.", hasLink: false },
    { text: "Your defence has more holes than the 'is a goalkeeper a defender' debate.", hasLink: false },
    { text: "You call that a transfer strategy? I call it a cry for help. Here, copy {link}.", hasLink: true },
    { text: "Not setting your team and hoping for the best would've scored more than this.", hasLink: false },
    { text: "You know what's worse than forgetting to set your team? Setting it like this.", hasLink: false },
    { text: "My nan could pick a better XI. And she thinks a goalkeeper is a defender.", hasLink: false },
    { text: "Bold of you to analyse these transfers. Some things are better left unexamined.", hasLink: false },
    { text: "At this point, just auto-pick and pray. Or copy {link}.", hasLink: true },
    { text: "The only thing stable about your season is your position at the bottom. Check {link} for inspiration.", hasLink: true },
    { text: "Imagine having this many transfers and still being worse than someone who forgot to set their team for 3 weeks.", hasLink: false },
    { text: "FPL tip: a goalkeeper counts as a defender if you believe hard enough. Just like your transfers count as strategy.", hasLink: false },
    { text: "Some managers play chess. You're playing snakes and ladders. Mostly snakes.", hasLink: false },
  ], []);

  const egoPun = useMemo(
    () => egoPuns[Math.floor(Math.random() * egoPuns.length)],
    [egoPuns]
  );

  const transfers = data?.transfers || [];
  const chips = data?.chips || [];

  const greatMoves = transfers.filter(t => t.rating === 'Great Move').length;
  const goodMoves = transfers.filter(t => t.rating === 'Good Move').length;
  const pointChasing = transfers.filter(t => t.rating === 'Point Chasing').length;
  const soldTooEarly = transfers.filter(t => t.rating === 'Sold Too Early').length;
  const sideways = transfers.filter(t => t.rating === 'Sideways').length;
  const tooSoon = transfers.filter(t => t.rating === 'Too Soon').length;

  // Calculate best and worst moves using netGain
  const validTransfers = transfers.filter(t => t.rating !== 'Too Soon');
  let maxDiff = -Infinity;
  let minDiff = Infinity;

  validTransfers.forEach(t => {
    if (t.netGain > maxDiff) maxDiff = t.netGain;
    if (t.netGain < minDiff) minDiff = t.netGain;
  });

  if (maxDiff <= 0) maxDiff = Infinity;
  if (minDiff >= 0) minDiff = -Infinity;

  // Hit cost per event
  const hitCostByEvent = (data?.gameweekHistory || []).reduce((acc, gw) => {
    acc[gw.event] = gw.transfersCost;
    return acc;
  }, {} as Record<number, number>);

  // Group transfers by event
  const transfersByEvent = transfers.reduce((acc, transfer) => {
    if (!acc[transfer.event]) {
      acc[transfer.event] = [];
    }
    acc[transfer.event].push(transfer);
    return acc;
  }, {} as Record<number, ProcessedTransfer[]>);

  // Group chips by event
  const chipsByEvent = chips.reduce((acc, chip) => {
    if (!acc[chip.event]) {
      acc[chip.event] = [];
    }
    acc[chip.event].push(chip);
    return acc;
  }, {} as Record<number, FPLChip[]>);

  // Get all unique events that have either transfers or chips
  const allEvents = Array.from(new Set([
    ...Object.keys(transfersByEvent).map(Number),
    ...Object.keys(chipsByEvent).map(Number)
  ])).sort((a, b) => b - a);

  // Count GW tiers
  const gwTierCounts = Object.keys(transfersByEvent).reduce((acc, eventStr) => {
    const event = Number(eventStr);
    const eventChips = chipsByEvent[event] || [];
    const chipName = eventChips.find(c => c.name === 'freehit')?.name;
    const weekly = getWeeklyScore(transfersByEvent[event], hitCostByEvent[event] ?? 0, chipName);
    acc[weekly.tier] = (acc[weekly.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatChipName = (name: string) => {
    switch (name) {
      case 'wildcard': return 'Wildcard';
      case 'freehit': return 'Free Hit';
      case 'bboost': return 'Bench Boost';
      case '3xc': return 'Triple Captain';
      case 'manager': return 'Manager';
      default: return name;
    }
  };

  const statusText = data
    ? `Current GW: ${data.currentEvent} | Last updated: ${lastUpdated ? lastUpdated.toLocaleString() : '-'}`
    : null;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      {initialTeamId && (
        <Link
          href={initialLeagueId ? `/league/${initialLeagueId}` : '/'}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {initialLeagueId ? 'Back to league' : 'Back to home'}
        </Link>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
          FPL Transfer Rater
        </h1>
        {!initialTeamId && (
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Enter your Fantasy Premier League Team ID to analyze your transfers.
            We evaluate each transfer by comparing both players&apos; form before and after the move.
          </p>
        )}
        {statusText && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{statusText}</p>
        )}
      </div>

      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
        <div className="relative flex items-center">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9\s]*"
            title="Please enter a numeric Team ID"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="Enter FPL Team ID (e.g. 123456)"
            className="w-full pl-4 pr-12 py-4 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-lg font-medium shadow-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
          You can find your Team ID in the URL of your FPL points page.
        </p>
      </form>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}

      {data && allEvents.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No transfers or chips found for this team.</p>
        </div>
      )}

      {data && allEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {teamId === '159021' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 p-4 rounded-xl text-center text-sm font-medium"
            >
              {egoPun.hasLink ? (
                <>
                  {egoPun.text.split('{link}')[0]}
                  <a href="https://fantasy.premierleague.com/entry/133463/history" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-900 dark:hover:text-indigo-300">my team</a>
                  {egoPun.text.split('{link}')[1]}
                </>
              ) : (
                egoPun.text
              )}
            </motion.div>
          )}
          {teamId === '6032721' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 p-4 rounded-xl text-center text-sm font-medium"
            >
              {horsePun}
            </motion.div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Gameweeks</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm text-center">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mb-1">{gwTierCounts.great || 0}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-500 uppercase tracking-wider font-semibold">Great</div>
              </div>
              <div className="bg-lime-50 dark:bg-lime-950/50 p-4 rounded-2xl border border-lime-200 dark:border-lime-800/50 shadow-sm text-center">
                <div className="text-2xl font-black text-lime-700 dark:text-lime-400 mb-1">{gwTierCounts.good || 0}</div>
                <div className="text-xs text-lime-600 dark:text-lime-500 uppercase tracking-wider font-semibold">Good</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm text-center">
                <div className="text-2xl font-black text-gray-700 dark:text-gray-400 mb-1">{gwTierCounts.neutral || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">OK</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/50 p-4 rounded-2xl border border-orange-200 dark:border-orange-800/50 shadow-sm text-center">
                <div className="text-2xl font-black text-orange-700 dark:text-orange-400 mb-1">{gwTierCounts.bad || 0}</div>
                <div className="text-xs text-orange-600 dark:text-orange-500 uppercase tracking-wider font-semibold">Bad</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-2xl border border-red-200 dark:border-red-800/50 shadow-sm text-center">
                <div className="text-2xl font-black text-red-700 dark:text-red-400 mb-1">{gwTierCounts.terrible || 0}</div>
                <div className="text-xs text-red-600 dark:text-red-500 uppercase tracking-wider font-semibold">Terrible</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm text-center">
                <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mb-1">{gwTierCounts.toosoon || 0}</div>
                <div className="text-xs text-amber-600 dark:text-amber-500 uppercase tracking-wider font-semibold">Too Soon</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Transfers</h3>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm text-center">
              <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{transfers.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Total</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm text-center">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mb-1">{greatMoves}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-500 uppercase tracking-wider font-semibold">Great</div>
            </div>
            <div className="bg-lime-50 dark:bg-lime-950/50 p-4 rounded-2xl border border-lime-200 dark:border-lime-800/50 shadow-sm text-center">
              <div className="text-2xl font-black text-lime-700 dark:text-lime-400 mb-1">{goodMoves}</div>
              <div className="text-xs text-lime-600 dark:text-lime-500 uppercase tracking-wider font-semibold">Good</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-2xl border border-red-200 dark:border-red-800/50 shadow-sm text-center">
              <div className="text-2xl font-black text-red-700 dark:text-red-400 mb-1">{pointChasing}</div>
              <div className="text-xs text-red-600 dark:text-red-500 uppercase tracking-wider font-semibold">Chasing</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/50 p-4 rounded-2xl border border-orange-200 dark:border-orange-800/50 shadow-sm text-center">
              <div className="text-2xl font-black text-orange-700 dark:text-orange-400 mb-1">{soldTooEarly}</div>
              <div className="text-xs text-orange-600 dark:text-orange-500 uppercase tracking-wider font-semibold">Sold Early</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm text-center">
              <div className="text-2xl font-black text-gray-700 dark:text-gray-400 mb-1">{sideways}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Sideways</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm text-center">
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mb-1">{tooSoon}</div>
              <div className="text-xs text-amber-600 dark:text-amber-500 uppercase tracking-wider font-semibold">Too Soon</div>
            </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('transfers')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'transfers'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3c]'
              }`}
            >
              <List className="w-4 h-4" />
              Transfers
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'charts'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3c]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Charts
            </button>
          </div>

          {activeTab === 'charts' && (
            <div className="space-y-6">
              <PointsChart gameweekHistory={data.gameweekHistory} transfers={transfers} chips={chips} />
              <TransferTimeline transfers={transfers} gameweekHistory={data.gameweekHistory} chips={chips} />
            </div>
          )}

          {activeTab === 'transfers' && <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Transfer History</h2>
            {allEvents.map((event, idx) => {
              const eventTransfers = transfersByEvent[event] || [];
              const eventChips = chipsByEvent[event] || [];

              const eventChipName = eventChips.find(c => c.name === 'freehit')?.name;
              const weekly = getWeeklyScore(eventTransfers, hitCostByEvent[event] ?? 0, eventChipName);
              const tierColors: Record<string, string> = {
                great: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
                good: 'bg-lime-100 text-lime-700 dark:bg-lime-950/60 dark:text-lime-400',
                neutral: 'bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-400',
                bad: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
                terrible: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
                toosoon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
                freehit: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400',
              };
              const weeklyColor = tierColors[weekly.tier];

              return (
                <motion.div
                  key={`event-${event}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden shadow-sm"
                >
                  <div className="bg-gray-50 dark:bg-[#242428] px-6 py-4 border-b border-gray-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gameweek {event}</h3>
                      {eventTransfers.length > 0 && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${weeklyColor}`}>
                          {weekly.label}
                        </span>
                      )}
                    </div>
                    
                    {eventChips.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {eventChips.map((chip, chipIdx) => (
                          <div 
                            key={`chip-${chip.name}-${chipIdx}`}
                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold"
                          >
                            <Zap className="w-4 h-4" />
                            {formatChipName(chip.name)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 sm:p-6 space-y-4">
                    {eventTransfers.length > 0 ? (
                      eventTransfers.map((transfer, tIdx) => {
                        const isBestMove = transfer.rating !== 'Too Soon' && transfer.netGain === maxDiff;
                        const isWorstMove = transfer.rating !== 'Too Soon' && transfer.netGain === minDiff;

                        return (
                          <TransferCard 
                            key={`${transfer.event}-${transfer.playerIn.id}-${tIdx}`} 
                            transfer={transfer} 
                            isBestMove={isBestMove}
                            isWorstMove={isWorstMove}
                          />
                        );
                      })
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No transfers made this week.</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>}
        </motion.div>
      )}
    </div>
  );
}

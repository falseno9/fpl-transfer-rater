'use client';

import { useState, useEffect, useCallback } from 'react';
import { processTransfers, ProcessedData, ProcessedTransfer, FPLChip } from '@/lib/fpl';
import { TransferCard } from '@/components/TransferCard';
import { Loader2, Search, AlertCircle, Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export function Dashboard({ initialTeamId }: { initialTeamId?: string }) {
  const [teamId, setTeamId] = useState(initialTeamId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ProcessedData | null>(null);

  const fetchData = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const result = await processTransfers(parseInt(id, 10));
      setData(result);
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

  const transfers = data?.transfers || [];
  const chips = data?.chips || [];

  const goodMoves = transfers.filter(t => t.rating === 'Good Move').length;
  const pointChasing = transfers.filter(t => t.rating === 'Point Chasing').length;
  const tooSoon = transfers.filter(t => t.rating === 'Too Soon').length;

  // Calculate best and worst moves
  const validTransfers = transfers.filter(t => t.rating !== 'Too Soon');
  let maxDiff = -Infinity;
  let minDiff = Infinity;

  validTransfers.forEach(t => {
    const diff = t.playerInAvg - t.playerOutTrailingAvg;
    if (diff > maxDiff) maxDiff = diff;
    if (diff < minDiff) minDiff = diff;
  });

  if (maxDiff <= 0) maxDiff = Infinity;
  if (minDiff >= 0) minDiff = -Infinity;

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

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      {initialTeamId && (
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
          FPL Transfer Rater
        </h1>
        {!initialTeamId && (
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Enter your Fantasy Premier League Team ID to analyze your transfers.
            We compare the 3-week average of your new player against the trailing 3-week average of the player you transferred out.
          </p>
        )}
      </div>

      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
        <div className="relative flex items-center">
          <input
            type="number"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm text-center">
              <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{transfers.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Total</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm text-center">
              <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mb-1">{goodMoves}</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-500 uppercase tracking-wider font-semibold">Good Moves</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/50 p-6 rounded-2xl border border-red-200 dark:border-red-800/50 shadow-sm text-center">
              <div className="text-3xl font-black text-red-700 dark:text-red-400 mb-1">{pointChasing}</div>
              <div className="text-sm text-red-600 dark:text-red-500 uppercase tracking-wider font-semibold">Chasing</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/50 p-6 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm text-center">
              <div className="text-3xl font-black text-amber-700 dark:text-amber-400 mb-1">{tooSoon}</div>
              <div className="text-sm text-amber-600 dark:text-amber-500 uppercase tracking-wider font-semibold">Too Soon</div>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Transfer History</h2>
            {allEvents.map((event, idx) => {
              const eventTransfers = transfersByEvent[event] || [];
              const eventChips = chipsByEvent[event] || [];

              return (
                <motion.div
                  key={`event-${event}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden shadow-sm"
                >
                  <div className="bg-gray-50 dark:bg-[#242428] px-6 py-4 border-b border-gray-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gameweek {event}</h3>
                    
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
                        const diff = transfer.playerInAvg - transfer.playerOutTrailingAvg;
                        const isBestMove = transfer.rating !== 'Too Soon' && diff === maxDiff;
                        const isWorstMove = transfer.rating !== 'Too Soon' && diff === minDiff;

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
          </div>
        </motion.div>
      )}
    </div>
  );
}

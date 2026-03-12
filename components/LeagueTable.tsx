'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLeagueStandings, getBootstrap, processTransfersWithBootstrap, LeagueMember } from '@/lib/fpl';
import { Loader2, AlertCircle, ArrowLeft, ChevronDown, ChevronUp, Minus, TrendingUp, TrendingDown, Undo2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

interface LeagueCache {
  leagueName: string;
  members: LeagueMember[];
  currentPage: number;
  hasNextPage: boolean;
  currentEvent: number | null;
  lastUpdated: Date;
}

const leagueCache = new Map<string, LeagueCache>();

export function LeagueTable({ leagueId }: { leagueId: string }) {
  const cached = leagueCache.get(leagueId);
  const [leagueName, setLeagueName] = useState(cached?.leagueName ?? '');
  const [members, setMembers] = useState<LeagueMember[]>(cached?.members ?? []);
  const [loading, setLoading] = useState(!cached);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [transfersLoaded, setTransfersLoaded] = useState(0);
  const [error, setError] = useState('');
  const [currentEvent, setCurrentEvent] = useState<number | null>(cached?.currentEvent ?? null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(cached?.lastUpdated ?? null);
  const [currentPage, setCurrentPage] = useState(cached?.currentPage ?? 1);
  const [hasNextPage, setHasNextPage] = useState(cached?.hasNextPage ?? false);
  const [loadingMore, setLoadingMore] = useState(false);

  const updateCache = useCallback((updates: Partial<LeagueCache>) => {
    const current = leagueCache.get(leagueId);
    leagueCache.set(leagueId, {
      leagueName: updates.leagueName ?? current?.leagueName ?? '',
      members: updates.members ?? current?.members ?? [],
      currentPage: updates.currentPage ?? current?.currentPage ?? 1,
      hasNextPage: updates.hasNextPage ?? current?.hasNextPage ?? false,
      currentEvent: updates.currentEvent ?? current?.currentEvent ?? null,
      lastUpdated: updates.lastUpdated ?? current?.lastUpdated ?? new Date(),
    });
  }, [leagueId]);

  const loadStandings = useCallback(async (page = 1) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');
    try {
      const data = await getLeagueStandings(parseInt(leagueId.trim(), 10), page);
      setLeagueName(data.name);
      setHasNextPage(data.hasNext);
      setCurrentPage(page);
      const now = new Date();
      if (page === 1) {
        setMembers(data.members);
        updateCache({ leagueName: data.name, members: data.members, hasNextPage: data.hasNext, currentPage: page, lastUpdated: now });
      } else {
        setMembers(prev => {
          const updated = [...prev, ...data.members];
          updateCache({ members: updated, hasNextPage: data.hasNext, currentPage: page, lastUpdated: now });
          return updated;
        });
      }
      setLastUpdated(now);
    } catch {
      setError('Failed to fetch league standings. Please check the League ID and try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [leagueId, updateCache]);

  const loadTransferRatings = useCallback(async (entries: LeagueMember[]) => {
    setTransfersLoading(true);
    try {
      const bootstrap = await getBootstrap();
      const current = bootstrap.events.find((e: any) => e.is_current)?.id ?? null;
      setCurrentEvent(current);
      const BATCH_SIZE = 3;
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (member) => {
            try {
              const data = await processTransfersWithBootstrap(member.entry, bootstrap);
              return {
                entry: member.entry,
                transferCount: data.transfers.length,
                greatMoves: data.transfers.filter(t => t.rating === 'Great Move').length,
                goodMoves: data.transfers.filter(t => t.rating === 'Good Move').length,
                pointChasing: data.transfers.filter(t => t.rating === 'Point Chasing').length,
                soldTooEarly: data.transfers.filter(t => t.rating === 'Sold Too Early').length,
                sideways: data.transfers.filter(t => t.rating === 'Sideways').length,
                tooSoon: data.transfers.filter(t => t.rating === 'Too Soon').length,
                loaded: true,
                error: false,
              };
            } catch {
              return { entry: member.entry, loaded: true, error: true };
            }
          })
        );

        setMembers(prev => {
          const updated = prev.map(m => {
            const result = results.find(r => r.entry === m.entry);
            return result ? { ...m, ...result } : m;
          });
          updateCache({ members: updated });
          return updated;
        });
        setTransfersLoaded(prev => prev + batch.length);
      }
      const now = new Date();
      setLastUpdated(now);
      updateCache({ currentEvent: current, lastUpdated: now });
    } catch {
      // bootstrap fetch failed — mark all as error
      setMembers(prev => prev.map(m => ({ ...m, loaded: true, error: true })));
    } finally {
      setTransfersLoading(false);
    }
  }, [updateCache]);

  useEffect(() => {
    if (!leagueCache.has(leagueId)) {
      loadStandings();
    }
  }, [leagueId, loadStandings]);

  useEffect(() => {
    const unloaded = members.filter(m => !m.loaded);
    if (unloaded.length > 0 && !transfersLoading) {
      loadTransferRatings(unloaded);
    }
  }, [members, transfersLoading, loadTransferRatings]);

  const rankChange = (member: LeagueMember) => {
    if (member.lastRank === 0) return null;
    const diff = member.lastRank - member.rank;
    if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium"><ChevronUp className="w-3 h-3" />{diff}</span>;
    if (diff < 0) return <span className="flex items-center gap-0.5 text-red-500 dark:text-red-400 text-xs font-medium"><ChevronDown className="w-3 h-3" />{Math.abs(diff)}</span>;
    return <span className="text-gray-400 text-xs"><Minus className="w-3 h-3" /></span>;
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            {leagueName}
          </h1>
          {(currentEvent || lastUpdated) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Current GW: {currentEvent ?? '-'} | Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '-'}
            </p>
          )}
          {transfersLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading transfer ratings ({transfersLoaded}/{members.length})
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#242428] border-b border-gray-200 dark:border-white/[0.08]">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Manager</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">GW</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-xs" title="Great + Good Moves">
                    <TrendingUp className="w-4 h-4 mx-auto" />
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider text-xs" title="Point Chasing">
                    <TrendingDown className="w-4 h-4 mx-auto" />
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-xs" title="Sold Too Early">
                    <Undo2 className="w-4 h-4 mx-auto" />
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider text-xs" title="Sideways">
                    <Minus className="w-4 h-4 mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <motion.tr
                    key={member.entry}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.04]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 dark:text-white">{member.rank}</span>
                        {rankChange(member)}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.04]">
                      <Link
                        href={`/team/${member.entry}?leagueId=${leagueId}`}
                        className="group block"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {member.playerName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{member.entryName}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.04] text-right font-medium text-gray-700 dark:text-gray-300">
                      {member.eventTotal}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.04] text-right font-bold text-gray-900 dark:text-white">
                      {member.total}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.04] text-center">
                      {member.loaded ? (
                        member.error ? (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        ) : (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{(member.greatMoves ?? 0) + (member.goodMoves ?? 0)}</span>
                        )
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.04] text-center">
                      {member.loaded ? (
                        member.error ? (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        ) : (
                          <span className="font-bold text-red-600 dark:text-red-400">{member.pointChasing}</span>
                        )
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.04] text-center">
                      {member.loaded ? (
                        member.error ? (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        ) : (
                          <span className="font-bold text-orange-600 dark:text-orange-400">{member.soldTooEarly}</span>
                        )
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.04] text-center">
                      {member.loaded ? (
                        member.error ? (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        ) : (
                          <span className="font-medium text-gray-500 dark:text-gray-400">{member.sideways}</span>
                        )
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-600 mx-auto" />
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => loadStandings(currentPage + 1)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

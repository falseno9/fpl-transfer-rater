'use client';

import { useState } from 'react';
import { ProcessedTransfer, GameweekHistory, FPLChip, getWeeklyScore } from '@/lib/fpl';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const ratingConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  'Great Move': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Great Move',
  },
  'Good Move': {
    bg: 'bg-lime-50 dark:bg-lime-950/50',
    text: 'text-lime-700 dark:text-lime-400',
    dot: 'bg-lime-500',
    label: 'Good Move',
  },
  'Point Chasing': {
    bg: 'bg-red-50 dark:bg-red-950/50',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'Point Chasing',
  },
  'Sold Too Early': {
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    label: 'Sold Too Early',
  },
  'Sideways': {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
    label: 'Sideways',
  },
  'Too Soon': {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'Too Soon',
  },
};

const tierStyles: Record<string, { color: string; dot: string }> = {
  great: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400', dot: 'bg-emerald-500' },
  good: { color: 'bg-lime-100 text-lime-700 dark:bg-lime-950/60 dark:text-lime-400', dot: 'bg-lime-500' },
  neutral: { color: 'bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-400', dot: 'bg-gray-400' },
  bad: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400', dot: 'bg-orange-500' },
  terrible: { color: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400', dot: 'bg-red-500' },
  toosoon: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400', dot: 'bg-amber-500' },
  freehit: { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400', dot: 'bg-indigo-500' },
};

interface TransferTimelineProps {
  transfers: ProcessedTransfer[];
  gameweekHistory: GameweekHistory[];
  chips?: FPLChip[];
}

export function TransferTimeline({ transfers, gameweekHistory, chips = [] }: TransferTimelineProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  const hitCostByEvent = gameweekHistory.reduce((acc, gw) => {
    acc[gw.event] = gw.transfersCost;
    return acc;
  }, {} as Record<number, number>);

  const chipByEvent = chips.reduce((acc, c) => {
    if (c.name === 'freehit') acc[c.event] = c.name;
    return acc;
  }, {} as Record<number, string>);

  // Group by gameweek
  const byEvent = transfers.reduce((acc, t) => {
    if (!acc[t.event]) acc[t.event] = [];
    acc[t.event].push(t);
    return acc;
  }, {} as Record<number, ProcessedTransfer[]>);

  const events = Object.keys(byEvent).map(Number).sort((a, b) => a - b);

  const toggleWeek = (event: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm p-4 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Transfer Timeline</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-white/10" />

        <div className="space-y-3">
          {events.map((event, idx) => {
            const gwTransfers = byEvent[event];
            const hitCost = hitCostByEvent[event] ?? 0;
            const weekly = getWeeklyScore(gwTransfers, hitCost, chipByEvent[event]);
            const style = tierStyles[weekly.tier];
            const isExpanded = expandedWeeks.has(event);

            return (
              <motion.div
                key={`gw-${event}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="relative"
              >
                {/* Summary row */}
                <button
                  onClick={() => toggleWeek(event)}
                  className="flex items-start gap-3 w-full text-left group"
                >
                  {/* Dot */}
                  <div className={`w-[11px] h-[11px] rounded-full ${style.dot} ring-2 ring-white dark:ring-[#1c1c1e] mt-2.5 shrink-0 relative z-10 ml-[10px]`} />

                  {/* Content */}
                  <div className={`flex-1 ${style.color} rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all group-hover:shadow-sm`}>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 w-10">
                      GW {event}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {gwTransfers.length} transfer{gwTransfers.length !== 1 ? 's' : ''}
                      {hitCost > 0 && <span className="text-red-500 ml-1">(−{hitCost} hit)</span>}
                    </span>
                    <span className="text-xs font-bold shrink-0">
                      {weekly.label}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded transfer details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-[36px] mt-1.5 space-y-1.5">
                        {gwTransfers.map((transfer, tIdx) => {
                          const config = ratingConfig[transfer.rating];
                          return (
                            <div
                              key={`${transfer.event}-${transfer.playerIn.id}-${tIdx}`}
                              className={`${config.bg} rounded-lg px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm`}
                            >
                              <span className="text-gray-900 dark:text-white flex-1">
                                <span className="text-red-500 dark:text-red-400 line-through">{transfer.playerOut.web_name}</span>
                                <span className="mx-1.5 text-gray-400">→</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{transfer.playerIn.web_name}</span>
                              </span>
                              <span className={`text-xs font-semibold ${config.text} shrink-0`}>
                                {config.label}
                              </span>
                              {transfer.rating !== 'Too Soon' && (
                                <span className={`text-xs font-mono font-bold shrink-0 ${transfer.netGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                  {transfer.netGain >= 0 ? '+' : ''}{transfer.netGain.toFixed(1)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

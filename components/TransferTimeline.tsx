'use client';

import { ProcessedTransfer } from '@/lib/fpl';
import { motion } from 'motion/react';

const ratingConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  'Good Move': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Good Move',
  },
  'Point Chasing': {
    bg: 'bg-red-50 dark:bg-red-950/50',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'Point Chasing',
  },
  'Neutral': {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
    label: 'Neutral',
  },
  'Too Soon': {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'Too Soon',
  },
};

interface TransferTimelineProps {
  transfers: ProcessedTransfer[];
}

export function TransferTimeline({ transfers }: TransferTimelineProps) {
  const sorted = [...transfers].sort((a, b) => a.event - b.event);

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm p-4 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Transfer Timeline</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-white/10" />

        <div className="space-y-3">
          {sorted.map((transfer, idx) => {
            const config = ratingConfig[transfer.rating];
            return (
              <motion.div
                key={`${transfer.event}-${transfer.playerIn.id}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-start gap-3 relative"
              >
                {/* Dot */}
                <div className={`w-[11px] h-[11px] rounded-full ${config.dot} ring-2 ring-white dark:ring-[#1c1c1e] mt-1.5 shrink-0 relative z-10 ml-[10px]`} />

                {/* Content */}
                <div className={`flex-1 ${config.bg} rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3`}>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 w-10">
                    GW {transfer.event}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white flex-1">
                    <span className="text-red-500 dark:text-red-400 line-through">{transfer.playerOut.web_name}</span>
                    <span className="mx-1.5 text-gray-400">→</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{transfer.playerIn.web_name}</span>
                  </span>
                  <span className={`text-xs font-semibold ${config.text} shrink-0`}>
                    {config.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

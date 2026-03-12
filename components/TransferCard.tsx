import { ProcessedTransfer } from '@/lib/fpl';
import { ArrowRight, TrendingDown, TrendingUp, Minus, Clock, Trophy, Frown, Undo2, ThumbsUp } from 'lucide-react';

export function TransferCard({ 
  transfer,
  isBestMove,
  isWorstMove
}: { 
  transfer: ProcessedTransfer;
  isBestMove?: boolean;
  isWorstMove?: boolean;
}) {
  const isGreat = transfer.rating === 'Great Move';
  const isGood = transfer.rating === 'Good Move';
  const isChasing = transfer.rating === 'Point Chasing';
  const isSoldTooEarly = transfer.rating === 'Sold Too Early';
  const isSideways = transfer.rating === 'Sideways';
  const isTooSoon = transfer.rating === 'Too Soon';

  const tooltip = isGreat
    ? `${transfer.playerIn?.web_name} outscored ${transfer.playerOut?.web_name} and kept or improved their form`
    : isGood
    ? `${transfer.playerIn?.web_name} outscored ${transfer.playerOut?.web_name}, but their form dipped from before you got them`
    : isChasing
    ? `${transfer.playerIn?.web_name} had strong form before you brought them in, but it dropped off after`
    : isSoldTooEarly
    ? `${transfer.playerOut?.web_name} started scoring well after you sold them, and ${transfer.playerIn?.web_name} didn't make up for it`
    : isSideways
    ? 'No clear gain or loss — this transfer was roughly a wash'
    : 'Not enough gameweeks have passed to judge this transfer yet';

  return (
    <div className={`rounded-xl shadow-sm border ${isBestMove ? 'border-amber-400 dark:border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/30' : isWorstMove ? 'border-red-400 dark:border-red-500/40 bg-red-50/30 dark:bg-red-950/30' : 'bg-white dark:bg-[#242428] border-gray-200 dark:border-white/[0.08]'} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md dark:hover:border-white/20`}>
      <div className="flex flex-col gap-2">
        {(isBestMove || isWorstMove) && (
          <div className="flex items-center gap-2">
            {isBestMove && (
              <span className="bg-amber-400 dark:bg-amber-500/20 text-amber-950 dark:text-amber-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                <Trophy className="w-3 h-3" /> Best Move
              </span>
            )}
            {isWorstMove && (
              <span className="bg-red-500 dark:bg-red-500/20 text-white dark:text-red-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                <Frown className="w-3 h-3" /> Worst Move
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-red-500 dark:text-red-400 font-medium line-through decoration-red-200 dark:decoration-red-900/50">{transfer.playerOut?.web_name || 'Unknown'}</span>
              <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{transfer.playerIn?.web_name || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 bg-gray-50 dark:bg-black/30 rounded-lg p-3 sm:bg-transparent sm:dark:bg-transparent sm:p-0">
        <div className="flex flex-col items-end">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">{transfer.playerIn?.web_name || 'IN'}</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">
            {isTooSoon ? '-' : `${transfer.playerInTrailingAvg.toFixed(1)} → ${transfer.playerInForwardAvg.toFixed(1)}`}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-red-500 dark:text-red-400 uppercase tracking-wider font-semibold">{transfer.playerOut?.web_name || 'OUT'}</span>
          <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
            {isTooSoon ? '-' : `${transfer.playerOutForwardAvg.toFixed(1)} pts after`}
          </span>
        </div>

        <div title={tooltip} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0 w-36 justify-center border cursor-help
          ${isGreat ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-700/40 dark:text-emerald-400' : ''}
          ${isGood ? 'bg-lime-50 border-lime-200 text-lime-700 dark:bg-lime-950/60 dark:border-lime-700/40 dark:text-lime-400' : ''}
          ${isChasing ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-700/40 dark:text-red-400' : ''}
          ${isSoldTooEarly ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/60 dark:border-orange-700/40 dark:text-orange-400' : ''}
          ${isSideways ? 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-white/[0.06] dark:border-white/10 dark:text-gray-300' : ''}
          ${isTooSoon ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-700/40 dark:text-amber-400' : ''}
        `}>
          {isGreat && <TrendingUp className="w-4 h-4" />}
          {isGood && <ThumbsUp className="w-4 h-4" />}
          {isChasing && <TrendingDown className="w-4 h-4" />}
          {isSoldTooEarly && <Undo2 className="w-4 h-4" />}
          {isSideways && <Minus className="w-4 h-4" />}
          {isTooSoon && <Clock className="w-4 h-4" />}
          {transfer.rating}
        </div>
      </div>
    </div>
  );
}

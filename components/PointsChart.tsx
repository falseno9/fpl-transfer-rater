'use client';

import { GameweekHistory, ProcessedTransfer } from '@/lib/fpl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

const ratingColors: Record<string, string> = {
  'Good Move': '#059669',
  'Point Chasing': '#dc2626',
  'Neutral': '#9ca3af',
  'Too Soon': '#d97706',
};

interface PointsChartProps {
  gameweekHistory: GameweekHistory[];
  transfers: ProcessedTransfer[];
}

export function PointsChart({ gameweekHistory, transfers }: PointsChartProps) {
  // Find best and worst transfers (excluding Too Soon)
  const ratedTransfers = transfers.filter(t => t.rating !== 'Too Soon');
  let bestDiff = -Infinity;
  let worstDiff = Infinity;
  ratedTransfers.forEach(t => {
    const diff = t.playerInAvg - t.playerOutTrailingAvg;
    if (diff > bestDiff) bestDiff = diff;
    if (diff < worstDiff) worstDiff = diff;
  });
  if (bestDiff <= 0) bestDiff = Infinity;
  if (worstDiff >= 0) worstDiff = -Infinity;

  const transfersByEvent = transfers.reduce((acc, t) => {
    if (!acc[t.event]) acc[t.event] = [];
    acc[t.event].push(t);
    return acc;
  }, {} as Record<number, ProcessedTransfer[]>);

  // Rating severity: lower = better, higher = worse
  const ratingSeverity: Record<string, number> = {
    'Good Move': 0, 'Neutral': 1, 'Too Soon': 2, 'Point Chasing': 3,
  };

  // For GWs with 1-2 transfers, show individual dots.
  // For GWs with 3+ (Wildcard/Free Hit), show best + worst rating (or one if all same).
  const transferDots = gameweekHistory
    .filter(gw => transfersByEvent[gw.event])
    .flatMap(gw => {
      const gwTransfers = transfersByEvent[gw.event];
      if (gwTransfers.length === 1) {
        return [{ event: gw.event, points: gw.points, rating: gwTransfers[0].rating }];
      }
      if (gwTransfers.length === 2) {
        return gwTransfers.map((t, i) => ({
          event: gw.event,
          points: gw.points + (i === 0 ? -3 : 3),
          rating: t.rating,
        }));
      }
      // 3+ transfers: show best and worst ratings present
      const ratings = [...new Set(gwTransfers.map(t => t.rating))];
      ratings.sort((a, b) => ratingSeverity[a] - ratingSeverity[b]);
      const best = ratings[0];
      const worst = ratings[ratings.length - 1];
      if (best === worst) {
        return [{ event: gw.event, points: gw.points, rating: best }];
      }
      return [
        { event: gw.event, points: gw.points + 3, rating: best },
        { event: gw.event, points: gw.points - 3, rating: worst },
      ];
    });

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm p-4 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Points Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={gameweekHistory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e5e7eb)" opacity={0.5} />
          <XAxis
            dataKey="event"
            tick={{ fontSize: 12, fill: 'var(--chart-text, #6b7280)' }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Gameweek', position: 'insideBottom', offset: -2, fontSize: 12, fill: 'var(--chart-text, #6b7280)' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--chart-text, #6b7280)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload as GameweekHistory;
              const gwTransfers = transfersByEvent[data.event];
              return (
                <div className="bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-white/10 rounded-xl p-3 shadow-lg text-sm">
                  <div className="font-bold text-gray-900 dark:text-white mb-1">GW {data.event}</div>
                  <div className="text-gray-600 dark:text-gray-400">{data.points} pts</div>
                  {gwTransfers && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/10 space-y-1.5">
                      {gwTransfers.map((t, i) => {
                        const diff = t.playerInAvg - t.playerOutTrailingAvg;
                        const isBest = t.rating !== 'Too Soon' && diff === bestDiff;
                        const isWorst = t.rating !== 'Too Soon' && diff === worstDiff;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: ratingColors[t.rating] }}
                            />
                            <span className="text-gray-500 dark:text-gray-400 flex-1">
                              <span className="text-red-500">{t.playerOut.web_name}</span>
                              {' → '}
                              <span className="text-emerald-600 dark:text-emerald-400">{t.playerIn.web_name}</span>
                            </span>
                            {t.rating !== 'Too Soon' && (
                              <span className={`font-mono font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                              </span>
                            )}
                            {isBest && <span className="text-[10px] font-bold text-amber-500">BEST</span>}
                            {isWorst && <span className="text-[10px] font-bold text-red-500">WORST</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="points"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#6366f1' }}
          />
          {transferDots.map((dot, i) => (
            <ReferenceDot
              key={`${dot.event}-${dot.rating}-${i}`}
              x={dot.event}
              y={dot.points}
              r={7}
              fill={ratingColors[dot.rating]}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />Good Move</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" />Point Chasing</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />Neutral</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />Too Soon</span>
      </div>
    </div>
  );
}

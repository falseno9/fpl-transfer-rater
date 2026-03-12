'use client';

import { GameweekHistory, ProcessedTransfer, FPLChip, getWeeklyScore } from '@/lib/fpl';
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
  'Great Move': '#059669',
  'Good Move': '#65a30d',
  'Point Chasing': '#dc2626',
  'Sold Too Early': '#ea580c',
  'Sideways': '#9ca3af',
  'Too Soon': '#d97706',
};

const tierDotColors: Record<string, string> = {
  great: '#059669',    // emerald
  good: '#65a30d',     // lime
  neutral: '#9ca3af',  // gray
  bad: '#ea580c',      // orange
  terrible: '#dc2626', // red
  toosoon: '#d97706',  // amber
  freehit: '#6366f1',  // indigo
};

interface PointsChartProps {
  gameweekHistory: GameweekHistory[];
  transfers: ProcessedTransfer[];
  chips?: FPLChip[];
}

export function PointsChart({ gameweekHistory, transfers, chips = [] }: PointsChartProps) {
  const transfersByEvent = transfers.reduce((acc, t) => {
    if (!acc[t.event]) acc[t.event] = [];
    acc[t.event].push(t);
    return acc;
  }, {} as Record<number, ProcessedTransfer[]>);

  const chipByEvent = chips.reduce((acc, c) => {
    if (c.name === 'freehit') acc[c.event] = c.name;
    return acc;
  }, {} as Record<number, string>);

  // One dot per GW, colored by weekly score (includes hits)
  const transferDots = gameweekHistory
    .filter(gw => transfersByEvent[gw.event])
    .map(gw => {
      const weekly = getWeeklyScore(transfersByEvent[gw.event], gw.transfersCost, chipByEvent[gw.event]);
      return {
        event: gw.event,
        points: gw.points,
        color: tierDotColors[weekly.tier],
      };
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
                  {gwTransfers && (() => {
                    const hitCost = data.transfersCost ?? 0;
                    const weekly = getWeeklyScore(gwTransfers, hitCost, chipByEvent[data.event]);
                    return (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-500 dark:text-gray-400">
                            {gwTransfers.length} transfer{gwTransfers.length !== 1 ? 's' : ''}
                            {hitCost > 0 ? ` (−${hitCost} hit)` : ''}
                          </span>
                          <span className={weekly.tier === 'toosoon' ? 'text-amber-500' : weekly.score >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                            {weekly.label}
                          </span>
                        </div>
                        {gwTransfers.map((t, i) => (
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
                              <span className={`font-mono font-bold ${t.netGain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {t.netGain >= 0 ? '+' : ''}{t.netGain.toFixed(1)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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
              key={`${dot.event}-${i}`}
              x={dot.event}
              y={dot.points}
              r={7}
              fill={dot.color}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />Great (+15)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-lime-600 inline-block" />Good (+5)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />OK (0)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-600 inline-block" />Bad (-5)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" />Terrible (&lt;-5)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />Too Soon</span>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const router = useRouter();
  const [teamId, setTeamId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingLeague, setLoadingLeague] = useState(false);

  const handleTeamSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId.trim()) return;
    setLoadingTeam(true);
    router.push(`/team/${teamId.trim()}`);
  };

  const handleLeagueSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueId.trim()) return;
    setLoadingLeague(true);
    router.push(`/league/${leagueId.trim()}`);
  };

  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-transparent py-12">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
            FPL Transfer Rater
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Analyze your Fantasy Premier League transfers. Compare the 3-week average
            of your new player against the trailing average of the player you transferred out.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4 min-h-[5.5rem]">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Team Lookup</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Analyze transfer decisions for one team</p>
              </div>
            </div>

            <form onSubmit={handleTeamSearch}>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  placeholder="Team ID"
                  className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#242428] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-medium shadow-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loadingTeam}
                  className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loadingTeam ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Found in the URL of your FPL points page
              </p>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4 min-h-[5.5rem]">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/20 rounded-xl">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">League Lookup</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Compare transfer decisions across mini-league rivals</p>
              </div>
            </div>

            <form onSubmit={handleLeagueSearch}>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  placeholder="League ID"
                  className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#242428] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-medium shadow-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loadingLeague}
                  className="absolute right-1.5 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loadingLeague ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Found in the URL of the league standings page
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

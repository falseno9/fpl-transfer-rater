import { Dashboard } from '@/components/Dashboard';

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ leagueId?: string }>;
}) {
  const { teamId } = await params;
  const { leagueId } = await searchParams;
  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-transparent py-12">
      <Dashboard initialTeamId={teamId} initialLeagueId={leagueId} />
    </main>
  );
}

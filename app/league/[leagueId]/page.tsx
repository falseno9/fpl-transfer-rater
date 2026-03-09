import { LeagueTable } from '@/components/LeagueTable';

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-transparent py-12">
      <LeagueTable leagueId={leagueId} />
    </main>
  );
}

import { Dashboard } from '@/components/Dashboard';

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-transparent py-12">
      <Dashboard initialTeamId={teamId} />
    </main>
  );
}

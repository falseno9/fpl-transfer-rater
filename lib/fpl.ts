export interface FPLPlayer {
  id: number;
  web_name: string;
  element_type: number;
  team: number;
}

export interface FPLTransfer {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
}

export interface ProcessedTransfer {
  event: number;
  playerIn: FPLPlayer;
  playerOut: FPLPlayer;
  playerInAvg: number;
  playerOutTrailingAvg: number;
  rating: 'Good Move' | 'Point Chasing' | 'Neutral' | 'Too Soon';
}

export interface FPLChip {
  event: number;
  name: string;
  time: string;
}

export interface ProcessedData {
  transfers: ProcessedTransfer[];
  chips: FPLChip[];
  currentEvent: number;
}

export interface LeagueMember {
  entry: number;
  playerName: string;
  entryName: string;
  rank: number;
  lastRank: number;
  eventTotal: number;
  total: number;
  goodMoves?: number;
  pointChasing?: number;
  neutral?: number;
  tooSoon?: number;
  transferCount?: number;
  loaded?: boolean;
  error?: boolean;
}

export interface LeagueData {
  name: string;
  members: LeagueMember[];
  hasNext: boolean;
  page: number;
}

export async function fetchFPL(path: string) {
  const res = await fetch(`/api/fpl?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}

export async function getBootstrap() {
  return fetchFPL('bootstrap-static/');
}

export async function getTransfers(teamId: number) {
  return fetchFPL(`entry/${teamId}/transfers/`);
}

export async function getHistory(teamId: number) {
  return fetchFPL(`entry/${teamId}/history/`);
}

export async function getPlayerSummary(playerId: number) {
  return fetchFPL(`element-summary/${playerId}/`);
}

export async function getLeagueStandings(leagueId: number, page = 1): Promise<LeagueData> {
  const data = await fetchFPL(`leagues-classic/${leagueId}/standings/?page_standings=${page}`);
  return {
    name: data.league.name,
    members: data.standings.results.map((r: any) => ({
      entry: r.entry,
      playerName: r.player_name,
      entryName: r.entry_name,
      rank: r.rank,
      lastRank: r.last_rank,
      eventTotal: r.event_total,
      total: r.total,
    })),
    hasNext: data.standings.has_next,
    page,
  };
}

export async function processTransfersWithBootstrap(
  teamId: number,
  bootstrap: any
): Promise<ProcessedData> {
  const [transfers, history] = await Promise.all([
    getTransfers(teamId),
    getHistory(teamId)
  ]);

  const currentEvent = bootstrap.events.find((e: any) => e.is_current)?.id || 1;

  const players: Record<number, FPLPlayer> = {};
  bootstrap.elements.forEach((p: any) => {
    players[p.id] = p;
  });

  // We need player summaries for all players transferred IN and OUT
  const playerInIds = Array.from(new Set<number>(transfers.map((t: any) => t.element_in)));
  const playerOutIds = Array.from(new Set<number>(transfers.map((t: any) => t.element_out)));
  const allPlayerIds = Array.from(new Set<number>([...playerInIds, ...playerOutIds]));
  
  // Fetch summaries in parallel
  const summaries: Record<number, any> = {};
  await Promise.all(
    allPlayerIds.map(async (id: number) => {
      summaries[id] = await getPlayerSummary(id);
    })
  );

  const processed: ProcessedTransfer[] = transfers.map((t: any) => {
    const playerIn = players[t.element_in];
    const playerOut = players[t.element_out];
    const summaryIn = summaries[t.element_in];
    const summaryOut = summaries[t.element_out];
    
    // Find 3-week average for player IN (GW of transfer + next 2 GWs)
    const historyIn = summaryIn.history.filter((h: any) => h.round >= t.event && h.round < t.event + 3);
    const inPoints = historyIn.reduce((sum: number, h: any) => sum + h.total_points, 0);
    const inAvg = inPoints / 3;
    
    // Find trailing average (last 3 GWs before transfer) for player OUT
    const trailingHistoryOut = summaryOut.history.filter((h: any) => h.round >= t.event - 3 && h.round < t.event);
    
    const numTrailingGWs = Math.min(3, t.event - 1);
    const trailingPoints = trailingHistoryOut.reduce((sum: number, h: any) => sum + h.total_points, 0);
    const trailingAvg = numTrailingGWs > 0 ? trailingPoints / numTrailingGWs : 0;

    let rating: 'Good Move' | 'Point Chasing' | 'Neutral' | 'Too Soon' = 'Neutral';

    if (currentEvent < t.event + 2) {
      rating = 'Too Soon';
    } else if (numTrailingGWs > 0) {
      const diff = inAvg - trailingAvg;
      // Good Move: player in is scoring meaningfully better (≥1.5x AND ≥2pts more)
      // also catches transfers out of a 0-scorer — any positive return qualifies
      if (inAvg >= trailingAvg * 1.5 && (diff >= 2 || trailingAvg === 0)) {
        rating = 'Good Move';
      // Point Chasing: player in is scoring notably worse (≤0.6x AND ≥2pts less)
      // require trailingAvg > 2 to avoid flagging transfers out of a bad run
      } else if (trailingAvg > 2 && inAvg <= trailingAvg * 0.6 && diff <= -2) {
        rating = 'Point Chasing';
      }
    }

    return {
      event: t.event,
      playerIn,
      playerOut,
      playerInAvg: inAvg,
      playerOutTrailingAvg: trailingAvg,
      rating
    };
  });

  return {
    transfers: processed.sort((a, b) => b.event - a.event),
    chips: history.chips || [],
    currentEvent,
  };
}

export async function processTransfers(teamId: number): Promise<ProcessedData> {
  const bootstrap = await getBootstrap();
  return processTransfersWithBootstrap(teamId, bootstrap);
}

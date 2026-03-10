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
  playerInTrailingAvg: number;
  playerInForwardAvg: number;
  playerOutTrailingAvg: number;
  playerOutForwardAvg: number;
  netGain: number;
  rating: 'Great Move' | 'Point Chasing' | 'Sold Too Early' | 'Sideways' | 'Too Soon';
}

export interface FPLChip {
  event: number;
  name: string;
  time: string;
}

export interface GameweekHistory {
  event: number;
  points: number;
  totalPoints: number;
  overallRank: number;
}

export interface ProcessedData {
  transfers: ProcessedTransfer[];
  chips: FPLChip[];
  currentEvent: number;
  gameweekHistory: GameweekHistory[];
}

export interface LeagueMember {
  entry: number;
  playerName: string;
  entryName: string;
  rank: number;
  lastRank: number;
  eventTotal: number;
  total: number;
  greatMoves?: number;
  pointChasing?: number;
  soldTooEarly?: number;
  sideways?: number;
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

    const numTrailingGWs = Math.min(3, t.event - 1);

    // Player IN trailing average (form before transfer — why you picked them)
    const inTrailingHistory = summaryIn.history.filter((h: any) => h.round >= t.event - 3 && h.round < t.event);
    const inTrailingPoints = inTrailingHistory.reduce((sum: number, h: any) => sum + h.total_points, 0);
    const playerInTrailingAvg = numTrailingGWs > 0 ? inTrailingPoints / numTrailingGWs : 0;

    // Player IN forward average (actual output after transfer)
    const inForwardHistory = summaryIn.history.filter((h: any) => h.round >= t.event && h.round < t.event + 3);
    const inForwardPoints = inForwardHistory.reduce((sum: number, h: any) => sum + h.total_points, 0);
    const playerInForwardAvg = inForwardPoints / 3;

    // Player OUT trailing average (form before transfer)
    const outTrailingHistory = summaryOut.history.filter((h: any) => h.round >= t.event - 3 && h.round < t.event);
    const outTrailingPoints = outTrailingHistory.reduce((sum: number, h: any) => sum + h.total_points, 0);
    const playerOutTrailingAvg = numTrailingGWs > 0 ? outTrailingPoints / numTrailingGWs : 0;

    // Player OUT forward average (performance after you sold them)
    const outForwardHistory = summaryOut.history.filter((h: any) => h.round >= t.event && h.round < t.event + 3);
    const outForwardPoints = outForwardHistory.reduce((sum: number, h: any) => sum + h.total_points, 0);
    const playerOutForwardAvg = outForwardPoints / 3;

    const netGain = playerInForwardAvg - playerOutForwardAvg;

    let rating: ProcessedTransfer['rating'] = 'Sideways';

    if (currentEvent < t.event + 2) {
      rating = 'Too Soon';
    } else if (netGain >= 1.5) {
      // Great Move: your new player clearly outscores the old one
      rating = 'Great Move';
    } else if (playerInTrailingAvg >= 1.5 && playerInForwardAvg <= playerInTrailingAvg * 0.6) {
      // Point Chasing: you bought a player whose form was fading
      rating = 'Point Chasing';
    } else if (playerOutForwardAvg >= playerOutTrailingAvg + 2.0 && netGain <= -1.5) {
      // Sold Too Early: player you sold started performing and your replacement is worse
      rating = 'Sold Too Early';
    }

    return {
      event: t.event,
      playerIn,
      playerOut,
      playerInTrailingAvg,
      playerInForwardAvg,
      playerOutTrailingAvg,
      playerOutForwardAvg,
      netGain,
      rating
    };
  });

  const gameweekHistory: GameweekHistory[] = (history.current || []).map((gw: any) => ({
    event: gw.event,
    points: gw.points,
    totalPoints: gw.total_points,
    overallRank: gw.overall_rank,
  }));

  return {
    transfers: processed.sort((a, b) => b.event - a.event),
    chips: history.chips || [],
    currentEvent,
    gameweekHistory,
  };
}

export async function processTransfers(teamId: number): Promise<ProcessedData> {
  const bootstrap = await getBootstrap();
  return processTransfersWithBootstrap(teamId, bootstrap);
}

import type { MatchEntry, OpponentEntry } from "../types";

export interface OpponentStats {
  totalMatches: number;
  wins: number;
  losses: number;
  ties: number;
  pins: number;
  techFalls: number;
  majorDecisions: number;
  lastMetDate?: string;
  lastResult?: "win" | "loss" | "tie";
  events: string[]; // unique event names where you've faced them
}

export function opponentDisplayName(o: OpponentEntry): string {
  return [o.firstName, o.lastName].filter(Boolean).join(" ").trim() || "—";
}

export function matchesWithOpponent(
  matches: MatchEntry[],
  opponent: OpponentEntry
): MatchEntry[] {
  const displayName = opponentDisplayName(opponent).toLowerCase();
  return matches
    .filter((m) => {
      if (m.opponentId === opponent.id) return true;
      // Also include unlinked matches where the free-text name matches
      if (!m.opponentId && m.opponent) {
        return m.opponent.trim().toLowerCase() === displayName;
      }
      return false;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function computeOpponentStats(
  matches: MatchEntry[],
  opponent: OpponentEntry
): OpponentStats {
  const rel = matchesWithOpponent(matches, opponent);
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let pins = 0;
  let techFalls = 0;
  let majorDecisions = 0;
  const events = new Set<string>();

  for (const m of rel) {
    if (m.result === "win") wins++;
    else if (m.result === "loss") losses++;
    else if (m.result === "tie") ties++;

    const wt = m.wrestling?.winType;
    if (m.result === "win" && wt === "pin") pins++;
    if (m.result === "win" && wt === "tech-fall") techFalls++;
    if (m.result === "win" && wt === "major-decision") majorDecisions++;

    if (m.event && m.event.trim()) events.add(m.event.trim());
  }

  const lastMet = rel[0];
  return {
    totalMatches: rel.length,
    wins,
    losses,
    ties,
    pins,
    techFalls,
    majorDecisions,
    lastMetDate: lastMet?.date,
    lastResult:
      lastMet?.result === "win" ||
      lastMet?.result === "loss" ||
      lastMet?.result === "tie"
        ? lastMet.result
        : undefined,
    events: [...events],
  };
}

/** Fuzzy-ish search: returns true if any field contains the needle. */
export function opponentMatchesQuery(
  o: OpponentEntry,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    o.firstName,
    o.lastName,
    o.teamName,
    o.state,
    o.coachName,
    o.weightClass,
    o.position,
    o.grade,
    o.jerseyNumber,
    o.strategyNotes,
    o.generalNotes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

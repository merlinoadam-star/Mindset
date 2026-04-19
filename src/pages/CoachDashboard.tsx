import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import { supabase } from "../lib/supabase";
import { useRealtime } from "../lib/useRealtime";
import {
  ACCOUNT_ROLE_EMOJIS,
  ACCOUNT_ROLE_LABELS,
  type AccountRole,
} from "../types";
import {
  Users,
  UserPlus,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Sparkles,
  Flame,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
  Smile,
  Activity,
} from "lucide-react";
import CoachGuidedTutorial from "../components/CoachGuidedTutorial";
import ParentCheckInCard from "../components/ParentCheckInCard";
import ParentPlaybookCard from "../components/ParentPlaybookCard";
import ParentXPBar from "../components/ParentXPBar";
import TeamBulkActions from "../components/TeamBulkActions";
import {
  fetchTeamStats,
  type AthleteStat,
  type AthleteFlag,
} from "../lib/teamStats";

interface ConnectedAthlete {
  connectionId: string;
  athleteAccountId: string;
  name: string;
  email: string;
  status: "pending" | "accepted";
  connectedRole: AccountRole; // "coach" or "parent"
  pendingIncoming: boolean; // true if this is an invite we need to accept
}

/**
 * Top-level dashboard for coach and parent accounts. Shows the list of
 * athletes they're connected to (plus any pending invites).
 *
 * This is rendered instead of the athlete dashboard when the signed-in
 * account's role is "coach" or "parent".
 */
export default function CoachDashboard() {
  const { account, user, signOut } = useAuth();
  const [athletes, setAthletes] = useState<ConnectedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(
    async (showSpinner: boolean) => {
      if (!supabase || !user) return;
      if (showSpinner) setLoading(true);
      // All connections where I'm the "other" party (coach/parent)
      const { data: conns, error: connsErr } = await supabase
        .from("connections")
        .select("*")
        .eq("other_account_id", user.id);
      if (connsErr) {
        setLoadError(connsErr.message);
        if (showSpinner) setLoading(false);
        return;
      }
      if (!conns) {
        if (showSpinner) setLoading(false);
        return;
      }
      setLoadError(null);
      const ids = conns.map((c) => c.athlete_account_id);
      const { data: accts } = ids.length
        ? await supabase
            .from("accounts")
            .select("id, display_name, email")
            .in("id", ids)
        : { data: [] as { id: string; display_name: string; email: string }[] };
      const acctMap = new Map((accts ?? []).map((a) => [a.id, a]));
      const result: ConnectedAthlete[] = conns
        .filter((c) => c.status === "pending" || c.status === "accepted")
        .map((c) => {
          const acct = acctMap.get(c.athlete_account_id);
          return {
            connectionId: c.id,
            athleteAccountId: c.athlete_account_id,
            name: acct?.display_name ?? "—",
            email: acct?.email ?? "",
            status: c.status,
            connectedRole: c.connected_role,
            pendingIncoming:
              c.status === "pending" && c.initiated_by === "athlete",
          };
        });
      setAthletes(result);
      if (showSpinner) setLoading(false);
    },
    [user]
  );

  useEffect(() => {
    refresh(true);
  }, [refresh]);

  // Realtime — refresh when a new invite arrives or a connection is
  // accepted / declined / revoked.
  const silentRefresh = useCallback(() => refresh(false), [refresh]);
  useRealtime(
    {
      table: "connections",
      filter: user ? `other_account_id=eq.${user.id}` : undefined,
      enabled: Boolean(user),
    },
    silentRefresh
  );

  const accepted = useMemo(
    () => athletes.filter((a) => a.status === "accepted"),
    [athletes]
  );
  const pending = useMemo(
    () => athletes.filter((a) => a.status === "pending"),
    [athletes]
  );

  // Fetch per-athlete stats (streak, level, last active)
  const [stats, setStats] = useState<Map<string, AthleteStat>>(new Map());
  useEffect(() => {
    const ids = accepted.map((a) => a.athleteAccountId);
    if (ids.length === 0) {
      setStats(new Map());
      return;
    }
    let cancelled = false;
    fetchTeamStats(ids).then((next) => {
      if (!cancelled) setStats(next);
    });
    return () => {
      cancelled = true;
    };
  }, [accepted]);

  type SortKey = "name" | "streak" | "mood" | "active" | "xp";
  const [sortBy, setSortBy] = useState<SortKey>("name");

  // Team aggregate numbers
  const teamAgg = useMemo(() => {
    const list = [...stats.values()];
    if (list.length === 0) {
      return { activeToday: 0, avgStreak: 0, onFire: 0, needsAttention: 0, total: 0 };
    }
    const activeToday = list.filter((s) => s.activeToday).length;
    const onFire = list.filter((s) => s.currentStreak >= 3).length;
    const needsAttention = list.filter(
      (s) => s.flags.some((f) => f !== "on-fire")
    ).length;
    const avgStreak =
      Math.round(
        (list.reduce((sum, s) => sum + s.currentStreak, 0) / list.length) * 10
      ) / 10;
    return { activeToday, avgStreak, onFire, needsAttention, total: list.length };
  }, [stats]);

  // Athletes needing attention
  const needsAttentionList = useMemo(() => {
    return accepted.filter((a) => {
      const s = stats.get(a.athleteAccountId);
      return s && s.flags.some((f) => f !== "on-fire");
    });
  }, [accepted, stats]);

  // Sorted roster
  const sortedAthletes = useMemo(() => {
    const copy = [...accepted];
    copy.sort((a, b) => {
      const sa = stats.get(a.athleteAccountId);
      const sb = stats.get(b.athleteAccountId);
      if (!sa || !sb) return 0;
      switch (sortBy) {
        case "streak":
          return sa.currentStreak - sb.currentStreak;
        case "mood":
          return (sa.avgMood7 ?? 0) - (sb.avgMood7 ?? 0);
        case "active":
          return sa.activeDays7 - sb.activeDays7;
        case "xp":
          return sb.xp - sa.xp;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return copy;
  }, [accepted, stats, sortBy]);

  if (!account) return null;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <header className="pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xl font-extrabold shadow-card">
            {ACCOUNT_ROLE_EMOJIS[account.role]}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">
              {greeting},
            </div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight truncate max-w-[180px]">
              {account.displayName}
            </div>
            <div className="text-[11px] text-slate-500">
              {ACCOUNT_ROLE_LABELS[account.role]}
            </div>
          </div>
        </div>
        <Link
          to="/settings"
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-card flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition"
        >
          <Settings size={18} />
        </Link>
      </header>

      <CoachGuidedTutorial
        hasAcceptedAthletes={accepted.length > 0}
        athleteIds={accepted.map((a) => a.athleteAccountId)}
      />

      {/* Parent Support Level — XP earned for supporting their athlete(s). */}
      {account.role === "parent" && accepted.length > 0 && <ParentXPBar />}

      {/* Welcome tip — only when they have athletes */}
      {accepted.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-950/50 dark:to-purple-950/50 border border-brand-100 dark:border-brand-900 p-3 flex items-start gap-2">
          <Sparkles size={14} className="text-brand-600 dark:text-brand-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            Tap any athlete to see their full profile, match log, progress
            charts, AI weekly recap, and more. You can set a weekly focus, send
            cheers, and leave notes from their page.
          </div>
        </div>
      )}

      {/* Parent-only: daily Playbook — 1-3 contextual actions derived
          from each athlete's recent data. One card per accepted athlete
          so parents of multiple kids still get the nudges they need. */}
      {account?.role === "parent" &&
        user &&
        accepted.length > 0 && (
          <div className="space-y-3">
            {accepted.map((a) => (
              <ParentPlaybookCard
                key={a.athleteAccountId}
                parentAccountId={user.id}
                athleteId={a.athleteAccountId}
              />
            ))}
          </div>
        )}

      {/* Parent-only: weekly conversation starter. Parents are the audience
          that currently has the fewest active tools — this gives them a
          concrete thing to ask after practice. */}
      {accepted.length > 0 &&
        account?.role === "parent" &&
        user && (
          <ParentCheckInCard
            accountId={user.id}
            primaryAthleteId={accepted[0]?.athleteAccountId}
          />
        )}

      {/* Pending invites (incoming) */}
      {pending.filter((p) => p.pendingIncoming).length > 0 && (
        <section>
          <h2 className="section-label mb-2 px-1">Invites for you</h2>
          <div className="space-y-2">
            {pending
              .filter((p) => p.pendingIncoming)
              .map((a) => (
                <div
                  key={a.connectionId}
                  className="card bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-extrabold">
                      {a.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {a.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {a.email}
                      </div>
                    </div>
                    <Link
                      to="/connections"
                      className="btn-primary !py-2 !px-3 text-xs"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Connected athletes */}
      {loadError ? (
        <div className="card bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200 flex items-start justify-between gap-3">
          <div>
            <div className="font-bold">Couldn&apos;t load your roster</div>
            <div className="text-xs mt-0.5 opacity-90">{loadError}</div>
          </div>
          <button
            onClick={() => refresh(true)}
            className="text-xs font-bold underline shrink-0"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="card text-sm text-slate-500 dark:text-slate-400">Loading athletes...</div>
      ) : accepted.length === 0 ? (
        <div className="card text-center py-10">
          <Users size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold mt-3 text-slate-900">
            No athletes connected yet
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            Ask your athlete to invite you from their Connections page, or
            invite them yourself by email.
          </p>
          <Link to="/connections" className="btn-primary mt-5 inline-flex items-center gap-1">
            <UserPlus size={16} /> Go to Connections
          </Link>
        </div>
      ) : (
        <>
          {/* Team overview strip */}
          {accepted.length >= 2 && (
            <div className="grid grid-cols-4 gap-2">
              <div className="card !p-3 text-center">
                <div className="text-xl font-extrabold tabular-nums text-brand-700 dark:text-brand-400">
                  {teamAgg.activeToday}
                  <span className="text-slate-300">/{teamAgg.total}</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                  Active
                </div>
              </div>
              <div className="card !p-3 text-center">
                <div className="text-xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
                  <Flame size={16} className="text-amber-500" />
                  {teamAgg.onFire}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                  On fire
                </div>
              </div>
              <div className="card !p-3 text-center">
                <div className="text-xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {teamAgg.avgStreak}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                  Avg streak
                </div>
              </div>
              <div className="card !p-3 text-center">
                <div className={`text-xl font-extrabold tabular-nums ${teamAgg.needsAttention > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {teamAgg.needsAttention}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                  {teamAgg.needsAttention === 0 ? "All good" : "Watch"}
                </div>
              </div>
            </div>
          )}

          {/* Needs attention — flagged athletes */}
          {needsAttentionList.length > 0 && (
            <section className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Needs attention
                </h2>
              </div>
              <div className="space-y-1.5">
                {needsAttentionList.map((a) => {
                  const s = stats.get(a.athleteAccountId);
                  if (!s) return null;
                  return (
                    <Link
                      key={a.connectionId}
                      to={`/athlete/${a.athleteAccountId}`}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm font-extrabold flex-shrink-0">
                        {a.name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {a.name}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {s.flags
                            .filter((f) => f !== "on-fire")
                            .map((f) => (
                              <FlagChip key={f} flag={f} />
                            ))}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bulk team actions */}
          <TeamBulkActions
            athleteIds={accepted.map((a) => a.athleteAccountId)}
          />

          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="section-label">
                {accepted.length >= 2 ? "Your Team" : "Your Athletes"}
              </h2>
              {accepted.length >= 2 && (
                <div className="flex items-center gap-1">
                  <ArrowUpDown size={11} className="text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none cursor-pointer pr-1"
                  >
                    <option value="name">Name</option>
                    <option value="streak">Streak ↑</option>
                    <option value="mood">Mood ↑</option>
                    <option value="active">Active days ↑</option>
                    <option value="xp">XP ↓</option>
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {sortedAthletes.map((a) => {
                const s = stats.get(a.athleteAccountId);
                const streakColor =
                  !s || s.currentStreak === 0
                    ? "text-slate-400"
                    : s.currentStreak >= 7
                    ? "text-amber-600 dark:text-amber-400"
                    : s.currentStreak >= 3
                    ? "text-orange-500"
                    : "text-slate-500";
                const hasWarning =
                  s && s.flags.some((f) => f !== "on-fire");
                return (
                  <Link
                    key={a.connectionId}
                    to={`/athlete/${a.athleteAccountId}`}
                    className={`card-interactive flex items-center gap-3 ${
                      hasWarning
                        ? "border-amber-200 dark:border-amber-800"
                        : ""
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-lg font-extrabold flex-shrink-0">
                      {a.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {a.name}
                        </div>
                        {s?.flags.includes("on-fire") && (
                          <span className="text-[9px] font-bold text-orange-700 bg-orange-100 dark:bg-orange-900 dark:text-orange-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            🔥 On fire
                          </span>
                        )}
                        {s && s.activeToday && !s.flags.includes("on-fire") && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      {s ? (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="inline-flex items-center gap-0.5">
                            <TrendingUp size={9} className="text-brand-500" />
                            Lvl {s.level}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span
                            className={`inline-flex items-center gap-0.5 font-semibold ${streakColor}`}
                          >
                            <Flame size={9} />
                            {s.currentStreak}d
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Activity size={9} className="text-emerald-500" />
                            {s.activeDays7}/7d
                          </span>
                          {s.avgMood7 !== null && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Smile size={9} className="text-purple-500" />
                                {s.avgMood7.toFixed(1)}
                                {s.moodTrend === "up" && <span className="text-emerald-600">↑</span>}
                                {s.moodTrend === "down" && <span className="text-red-500">↓</span>}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {a.email}
                        </div>
                      )}
                      {s && s.flags.some((f) => f !== "on-fire") && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.flags.filter((f) => f !== "on-fire").map((f) => (
                            <FlagChip key={f} flag={f} />
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-300 flex-shrink-0"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Pending invites you sent (out) */}
      {pending.filter((p) => !p.pendingIncoming).length > 0 && (
        <section>
          <h2 className="section-label mb-2 px-1">Pending invites you sent</h2>
          <div className="space-y-2">
            {pending
              .filter((p) => !p.pendingIncoming)
              .map((a) => (
                <div key={a.connectionId} className="card flex items-center gap-3">
                  <Clock size={18} className="text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {a.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Awaiting their response
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-bold text-slate-900 mb-2 text-sm">Quick actions</h2>
        <div className="space-y-2">
          <Link
            to="/connections"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 transition"
          >
            <Users size={18} className="text-brand-600" />
            <div className="flex-1 text-sm font-semibold text-slate-800">
              Connections
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50 transition text-left"
          >
            <LogOut size={18} className="text-slate-500" />
            <div className="flex-1 text-sm font-semibold text-slate-800">
              Sign out
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

const FLAG_CONFIG: Record<
  AthleteFlag,
  { label: string; color: string } | null
> = {
  inactive: { label: "Inactive 3d+", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  "mood-down": { label: "Mood dipping", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  "streak-broke": { label: "Streak broke", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  "low-activity": { label: "Low activity", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  "on-fire": null,
};

function FlagChip({ flag }: { flag: AthleteFlag }) {
  const cfg = FLAG_CONFIG[flag];
  if (!cfg) return null;
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

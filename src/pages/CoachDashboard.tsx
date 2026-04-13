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
} from "lucide-react";

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

  const refresh = useCallback(
    async (showSpinner: boolean) => {
      if (!supabase || !user) return;
      if (showSpinner) setLoading(true);
      // All connections where I'm the "other" party (coach/parent)
      const { data: conns } = await supabase
        .from("connections")
        .select("*")
        .eq("other_account_id", user.id);
      if (!conns) {
        if (showSpinner) setLoading(false);
        return;
      }
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
            <div className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {account.displayName}
            </div>
            <div className="text-[11px] text-slate-500">
              {ACCOUNT_ROLE_LABELS[account.role]}
            </div>
          </div>
        </div>
        <Link
          to="/settings"
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-card flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
        >
          <Settings size={18} />
        </Link>
      </header>

      {/* Phase 2B preview notice */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100 p-3 flex items-start gap-2">
        <Sparkles size={14} className="text-brand-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold">
            Welcome, {ACCOUNT_ROLE_LABELS[account.role].toLowerCase()}!
          </span>{" "}
          Your connected athletes show up below. Data sync is rolling out in
          stages — for now you&apos;ll see their names and status. In the next
          update, you&apos;ll see their full profile, match log, and progress.
        </div>
      </div>

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
                  className="card bg-gradient-to-br from-amber-50 to-white border-amber-200"
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
      {loading ? (
        <div className="card text-sm text-slate-500">Loading athletes...</div>
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
        <section>
          <h2 className="section-label mb-2 px-1">Your Athletes</h2>
          <div className="space-y-2">
            {accepted.map((a) => (
              <Link
                key={a.connectionId}
                to={`/athlete/${a.athleteAccountId}`}
                className="card-interactive flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-lg font-extrabold">
                  {a.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {a.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {a.email}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                    Connected as {ACCOUNT_ROLE_LABELS[a.connectedRole]}
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
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

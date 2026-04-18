import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ChevronRight } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { supabase } from "../lib/supabase";
import { useRealtime } from "../lib/useRealtime";
import { fetchUnreadAdultChatByOther } from "../lib/adultChatSync";
import type { AccountRole } from "../types";

/**
 * Shows the list of opposite-role adults the viewer can privately
 * message about this athlete. Coaches see connected parents; parents
 * see connected coaches. Hidden for athletes entirely.
 *
 * Self-contained — fetches its own connection data and per-thread
 * unread counts. Realtime-subscribed to `adult_chats` so a newly
 * arrived message bumps the unread badge live.
 */

interface Props {
  athleteId: string;
  athleteName: string;
}

interface OtherAdult {
  accountId: string;
  displayName: string;
  role: "coach" | "parent";
}

export default function PrivateChatsSection({
  athleteId,
  athleteName,
}: Props) {
  const { account, user } = useAuth();
  const [others, setOthers] = useState<OtherAdult[]>([]);
  const [unread, setUnread] = useState<Map<string, number>>(new Map());
  const [loaded, setLoaded] = useState(false);

  const myRole: AccountRole | undefined = account?.role;
  const desiredOtherRole: "coach" | "parent" | null =
    myRole === "coach" ? "parent" : myRole === "parent" ? "coach" : null;

  const load = useCallback(async () => {
    if (
      !supabase ||
      !user ||
      !account ||
      !desiredOtherRole ||
      !athleteId
    ) {
      return;
    }
    // 1. All accepted connections for this athlete.
    const { data: conns } = await supabase
      .from("connections")
      .select("other_account_id, connected_role")
      .eq("athlete_account_id", athleteId)
      .eq("status", "accepted");
    if (!conns || conns.length === 0) {
      setOthers([]);
      setLoaded(true);
      return;
    }
    // 2. Filter to people whose role is the opposite of mine, and
    // who aren't me (I'm connected too, obviously).
    const otherIds = conns
      .filter(
        (c) =>
          c.connected_role === desiredOtherRole &&
          c.other_account_id !== account.id
      )
      .map((c) => c.other_account_id as string);

    if (otherIds.length === 0) {
      setOthers([]);
      setLoaded(true);
      return;
    }

    // 3. Look up display names + confirm role (connected_role tracks
    // what they connected AS; actual account role can still diverge
    // in weird states).
    const { data: accts } = await supabase
      .from("accounts")
      .select("id, display_name, role")
      .in("id", otherIds);
    const list: OtherAdult[] = (accts ?? [])
      .filter(
        (a): a is { id: string; display_name: string; role: AccountRole } =>
          (a.role === "coach" || a.role === "parent") &&
          a.role === desiredOtherRole
      )
      .map((a) => ({
        accountId: a.id,
        displayName: a.display_name ?? "",
        role: a.role as "coach" | "parent",
      }));
    setOthers(list);

    // 4. Per-thread unread counts.
    const counts = await fetchUnreadAdultChatByOther(account.id, athleteId);
    setUnread(counts);
    setLoaded(true);
  }, [account, user, desiredOtherRole, athleteId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(
    {
      table: "adult_chats",
      filter: `athlete_account_id=eq.${athleteId}`,
      enabled: Boolean(account),
    },
    load
  );

  if (!account || (account.role !== "coach" && account.role !== "parent")) {
    return null;
  }
  if (!loaded) return null;
  if (others.length === 0) return null;

  const othersLabel =
    desiredOtherRole === "coach" ? "coaches" : "parents";

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center">
          <Lock size={13} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Private chat
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Coordinate with {athleteName}&apos;s {othersLabel} about how to
            support them. {athleteName} can&apos;t see these threads.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {others.map((o) => (
          <Link
            key={o.accountId}
            to={`/chat/${athleteId}/${o.accountId}`}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
          >
            <div
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 flex items-center justify-center text-xs font-bold flex-shrink-0"
              aria-hidden="true"
            >
              {initialOf(o.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {o.displayName || (o.role === "coach" ? "Coach" : "Parent")}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {o.role === "coach" ? "Coach" : "Parent"}
              </div>
            </div>
            {unread.get(o.accountId) ? (
              <div className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums min-w-[20px] text-center flex-shrink-0">
                {unread.get(o.accountId)}
              </div>
            ) : null}
            <ChevronRight
              size={16}
              className="text-slate-300 dark:text-slate-600 flex-shrink-0"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useRealtime } from "../lib/useRealtime";
import {
  deleteAnnouncement,
  fetchAnnouncementsForMe,
  markAnnouncementRead,
  type Announcement,
} from "../lib/announcementsSync";

/**
 * Surfaces coach announcements on a recipient's dashboard. Used by
 * athletes AND parents — both roles see the same card. Coaches also
 * see it (for their own posts) so they can preview what they sent
 * and delete if needed.
 *
 * Auto-marks an announcement read when the user expands it. Unread
 * items show a rose dot badge and bolder text.
 */
export default function AnnouncementsCard() {
  const { account } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!account) return;
    const rows = await fetchAnnouncementsForMe();
    setItems(rows);
    setLoaded(true);
  }, [account]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(
    {
      table: "team_announcements",
      enabled: Boolean(account),
    },
    load
  );
  useRealtime(
    {
      table: "team_announcement_reads",
      filter: account ? `reader_account_id=eq.${account.id}` : undefined,
      enabled: Boolean(account),
    },
    load
  );

  const unreadCount = useMemo(
    () => items.filter((a) => !a.read_at).length,
    [items]
  );

  const toggle = useCallback(
    (a: Announcement) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(a.id)) next.delete(a.id);
        else next.add(a.id);
        return next;
      });
      // Expanding = user saw it → mark read (idempotent).
      if (!a.read_at && account) {
        markAnnouncementRead({
          announcementId: a.id,
          readerAccountId: account.id,
        });
        setItems((prev) =>
          prev.map((p) =>
            p.id === a.id ? { ...p, read_at: new Date().toISOString() } : p
          )
        );
      }
    },
    [account]
  );

  const onDelete = useCallback(
    async (a: Announcement) => {
      if (!window.confirm("Delete this announcement?")) return;
      const { error } = await deleteAnnouncement(a.id);
      if (!error) setItems((prev) => prev.filter((p) => p.id !== a.id));
    },
    []
  );

  if (!account) return null;
  if (!loaded) return null;
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-amber-200/60 dark:border-amber-800/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0">
          <Megaphone size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-amber-700 dark:text-amber-300">
            Team announcements
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
            {unreadCount > 0
              ? `${unreadCount} new`
              : "All caught up."}
          </div>
        </div>
      </header>

      <ul className="divide-y divide-amber-200/60 dark:divide-amber-800/60 bg-white/40 dark:bg-slate-900/40">
        {items.map((a) => {
          const isExpanded = expandedIds.has(a.id);
          const isUnread = !a.read_at;
          const isMine = account.id === a.coach_account_id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => toggle(a)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/60 dark:hover:bg-slate-800/40"
                aria-expanded={isExpanded}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-rose-500 dark:bg-rose-400"
                  style={{ visibility: isUnread ? "visible" : "hidden" }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.title ? (
                      <span
                        className={`text-sm leading-tight ${
                          isUnread
                            ? "font-extrabold text-slate-900 dark:text-slate-100"
                            : "font-semibold text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {a.title}
                      </span>
                    ) : (
                      <span
                        className={`text-sm leading-tight ${
                          isUnread
                            ? "font-bold text-slate-900 dark:text-slate-100"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {a.body.length > 60 && !isExpanded
                          ? `${a.body.slice(0, 60)}…`
                          : a.body.split("\n")[0]}
                      </span>
                    )}
                    {a.coach_name && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Coach {a.coach_name}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatAgo(a.created_at)}
                    </span>
                  </div>
                  {isExpanded && (
                    <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-snug">
                      {a.body}
                    </p>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                )}
              </button>

              {isExpanded && isMine && (
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(a);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    <Trash2 size={11} /> Delete announcement
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const minutes = Math.round((now - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

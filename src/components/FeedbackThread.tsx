import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/authContext";
import {
  deleteFeedback,
  fetchFeedbackForTarget,
  markFeedbackRead,
  postFeedback,
  type FeedbackRow,
  type FeedbackTargetType,
} from "../lib/feedbackSync";
import { useRealtime } from "../lib/useRealtime";
import { ACCOUNT_ROLE_EMOJIS, ACCOUNT_ROLE_LABELS } from "../types";
import { MessageSquare, Send, Trash2, Check, Clock, Pin, PinOff } from "lucide-react";

interface Props {
  /** Athlete whose data is being commented on (UUID). */
  athleteId: string;
  targetType: FeedbackTargetType;
  /** Match id, video id, practice id, etc. (UUID). */
  targetId: string;
  /** Compact mode renders a tighter layout (used inside cards). */
  compact?: boolean;
  /**
   * Video context — when present, notes can be pinned to a timestamp
   * and existing notes show a clickable pill that seeks the video.
   * Only meaningful when targetType is 'video'.
   */
  videoCurrentTime?: number;
  onSeekTo?: (seconds: number) => void;
}

/**
 * Threaded feedback under a specific target (match, video, etc.).
 * - Coaches and parents can write notes.
 * - Athletes see all notes. Viewing marks them read.
 * - Authors can delete their own notes.
 * - Shows "seen" marker on notes the athlete has read.
 */
export default function FeedbackThread({
  athleteId,
  targetType,
  targetId,
  compact = false,
  videoCurrentTime,
  onSeekTo,
}: Props) {
  const { user, account } = useAuth();
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  /** Whether to stamp the next note with the current video timestamp. */
  const [pinTimestamp, setPinTimestamp] = useState(true);

  // Video context is available when targetType is 'video' AND the host
  // surface passed a current-time + seek callback.
  const hasVideoContext =
    targetType === "video" &&
    typeof videoCurrentTime === "number" &&
    typeof onSeekTo === "function";

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchFeedbackForTarget(
      athleteId,
      targetType,
      targetId
    );
    setItems(rows);
    setLoading(false);
  }, [athleteId, targetType, targetId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime — reload the thread whenever any feedback for this athlete
  // changes. Filter is athlete-scoped (Supabase allows one filter), we
  // just re-fetch scoped to this target.
  useRealtime(
    {
      table: "feedback",
      filter: `athlete_id=eq.${athleteId}`,
      enabled: Boolean(user),
    },
    load
  );

  // If the viewer is the athlete, auto-mark any unread notes as read
  // after a short delay. Self-stabilizing — the read state change triggers
  // a realtime event that re-fetches with read_at populated, so unread
  // count drops to zero and the effect becomes a no-op.
  useEffect(() => {
    if (!user || !account) return;
    if (account.role !== "athlete") return;
    const unreadIds = items
      .filter((i) => !i.read_at && i.author_id !== user.id)
      .map((i) => i.id);
    if (unreadIds.length === 0) return;
    const t = window.setTimeout(() => {
      markFeedbackRead(unreadIds).then(() => {
        setItems((prev) =>
          prev.map((p) =>
            unreadIds.includes(p.id)
              ? { ...p, read_at: new Date().toISOString() }
              : p
          )
        );
      });
    }, 1500);
    return () => window.clearTimeout(t);
  }, [items, user, account]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !account) return;
    if (!text.trim()) return;
    setSending(true);
    const { row, error } = await postFeedback({
      athleteId,
      authorId: user.id,
      authorRole: account.role,
      targetType,
      targetId,
      text,
      timestampSec:
        hasVideoContext && pinTimestamp && typeof videoCurrentTime === "number"
          ? videoCurrentTime
          : null,
    });
    if (row) {
      setItems((prev) => [...prev, { ...row, author_name: account.displayName }]);
      setText("");
    } else if (error) {
      alert(error);
    }
    setSending(false);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    await deleteFeedback(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  if (!account) return null;

  const canCompose =
    account.role === "coach" ||
    account.role === "parent" ||
    account.role === "athlete";

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 ${
        compact ? "p-3 space-y-2.5" : "p-4 space-y-3"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
        <MessageSquare size={12} />
        Coach / Parent Notes
        {items.length > 0 && (
          <span className="ml-1 text-slate-400 dark:text-slate-500">· {items.length}</span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 dark:text-slate-500">Loading notes...</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-slate-400 dark:text-slate-500 italic">
          No notes yet. Add one below.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const isMine = user?.id === it.author_id;
            return (
              <li
                key={it.id}
                className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="text-lg flex-shrink-0 pt-0.5">
                    {ACCOUNT_ROLE_EMOJIS[it.author_role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {it.author_name || ACCOUNT_ROLE_LABELS[it.author_role]}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatAgo(it.created_at)}
                      </span>
                      {it.timestamp_sec != null && onSeekTo && (
                        <button
                          type="button"
                          onClick={() => onSeekTo(it.timestamp_sec as number)}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-800 px-1.5 py-0.5 rounded-full focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
                          aria-label={`Jump to ${formatTimestamp(it.timestamp_sec)}`}
                        >
                          <Clock size={9} strokeWidth={3} />
                          {formatTimestamp(it.timestamp_sec)}
                        </button>
                      )}
                      {isMine && it.read_at && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check size={9} strokeWidth={3} /> Seen
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-snug">
                      {it.text}
                    </p>
                  </div>
                  {isMine && (
                    <button
                      onClick={() => onDelete(it.id)}
                      className="w-6 h-6 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center flex-shrink-0"
                      aria-label="Delete note"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canCompose && (
        <form onSubmit={submit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                account.role === "athlete"
                  ? "Your thoughts..."
                  : hasVideoContext
                  ? "Leave a note at this moment..."
                  : "Leave a note for your athlete..."
              }
              className="flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-brand-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              aria-label="Send note"
              className="px-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-sm disabled:opacity-40 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Send size={14} />
            </button>
          </div>

          {hasVideoContext && (account.role === "coach" || account.role === "parent") && (
            <button
              type="button"
              onClick={() => setPinTimestamp((p) => !p)}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 transition ${
                pinTimestamp
                  ? "bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
              aria-pressed={pinTimestamp}
            >
              {pinTimestamp ? (
                <>
                  <Pin size={10} strokeWidth={3} />
                  Pin to {formatTimestamp(videoCurrentTime ?? 0)}
                </>
              ) : (
                <>
                  <PinOff size={10} strokeWidth={3} />
                  No timestamp
                </>
              )}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

function formatAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const seconds = Math.round((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { supabase } from "../lib/supabase";
import { useRealtime } from "../lib/useRealtime";

/**
 * Collapsible bug-ticket row. Collapsed = just the initial report.
 * Expanded = full thread + reply composer. Coach gets a "Delete
 * conversation" button in the expanded state that removes the root
 * feedback row; RLS + ON DELETE CASCADE handles the replies.
 */

export type FeedbackType = "bug" | "idea" | "other";

export interface FeedbackRoot {
  id: string;
  feedback_type: FeedbackType;
  text: string;
  page: string | null;
  created_at: string;
  display_name: string | null;
  role: string | null;
}

interface Reply {
  id: string;
  feedback_id: string;
  account_id: string | null;
  display_name: string | null;
  role: string | null;
  text: string;
  created_at: string;
}

interface Props {
  feedback: FeedbackRoot;
  /** Called after a successful "Delete conversation" so the parent can drop it from the list. */
  onDeleted?: (id: string) => void;
}

export default function FeedbackTicket({ feedback, onDeleted }: Props) {
  const { account, user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Reply[] | null>(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyCount, setReplyCount] = useState<number | null>(null);

  const hasLoadedOnce = useRef(false);

  // Fetch reply COUNT (not full rows) once on mount so the collapsed
  // row can show "3 replies" without loading the whole thread.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("app_feedback_replies")
        .select("id", { head: true, count: "exact" })
        .eq("feedback_id", feedback.id);
      if (!cancelled) setReplyCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [feedback.id]);

  // Lazy-load full reply list when expanded. Only fetches the first
  // time; after that the local state + realtime keeps it fresh.
  const loadReplies = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("app_feedback_replies")
      .select("*")
      .eq("feedback_id", feedback.id)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setReplies((data ?? []) as Reply[]);
    setReplyCount((data ?? []).length);
    hasLoadedOnce.current = true;
  }, [feedback.id]);

  useEffect(() => {
    if (expanded && !hasLoadedOnce.current) {
      loadReplies();
    }
  }, [expanded, loadReplies]);

  // Live updates on an open thread.
  useRealtime(
    {
      table: "app_feedback_replies",
      filter: `feedback_id=eq.${feedback.id}`,
      enabled: expanded,
    },
    loadReplies
  );

  const postReply = useCallback(async () => {
    if (!supabase || !user || !account) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const { data, error } = await supabase
      .from("app_feedback_replies")
      .insert({
        feedback_id: feedback.id,
        account_id: user.id,
        display_name: account.displayName ?? null,
        role: account.role ?? null,
        text: trimmed,
      })
      .select()
      .single();
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Optimistic append (realtime will also fire, but may race).
    setReplies((prev) => {
      const next = prev ?? [];
      if (next.some((r) => r.id === (data as Reply).id)) return next;
      return [...next, data as Reply];
    });
    setReplyCount((c) => (c ?? 0) + 1);
    setDraft("");
  }, [supabase, user, account, draft, feedback.id]);

  const deleteConversation = useCallback(async () => {
    if (!supabase) return;
    const ok = window.confirm(
      "Delete this ticket and all replies? This can't be undone."
    );
    if (!ok) return;
    const { error } = await supabase
      .from("app_feedback")
      .delete()
      .eq("id", feedback.id);
    if (error) {
      setError(`Couldn't delete: ${error.message}`);
      return;
    }
    onDeleted?.(feedback.id);
  }, [supabase, feedback.id, onDeleted]);

  const typeClasses =
    feedback.feedback_type === "bug"
      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      : feedback.feedback_type === "idea"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <div className="card !p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800/50 focus-visible:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${typeClasses}`}
              >
                {feedback.feedback_type}
              </span>
              {feedback.display_name && (
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                  {feedback.display_name}
                  {feedback.role ? ` (${feedback.role})` : ""}
                </span>
              )}
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {new Date(feedback.created_at).toLocaleDateString()}
              </span>
              {feedback.page && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  · {feedback.page}
                </span>
              )}
              {replyCount != null && replyCount > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/50 px-1.5 py-0.5 rounded-full">
                  <MessageCircle size={9} strokeWidth={3} />
                  {replyCount}
                </span>
              )}
            </div>
            <p
              className={`text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-snug ${
                expanded ? "" : "line-clamp-3"
              }`}
            >
              {feedback.text}
            </p>
          </div>
          {expanded ? (
            <ChevronUp size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0 mt-1" />
          ) : (
            <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0 mt-1" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-3 py-3 space-y-2">
          {/* Replies */}
          {loading ? (
            <div className="text-xs text-slate-400 dark:text-slate-500">Loading replies…</div>
          ) : replies && replies.length > 0 ? (
            <ul className="space-y-2">
              {replies.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                      {r.display_name || "Someone"}
                    </span>
                    {r.role && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                        {r.role}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatAgo(r.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-snug">
                    {r.text}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-slate-400 dark:text-slate-500 italic">
              No replies yet.
            </div>
          )}

          {/* Compose */}
          {user && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                postReply();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  account?.role === "coach"
                    ? "Ask a follow-up question…"
                    : "Add more detail…"
                }
                maxLength={2000}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-xs focus:border-brand-500 outline-none"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send reply"
                className="px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs disabled:opacity-40 flex items-center gap-1"
              >
                <Send size={12} />
              </button>
            </form>
          )}

          {error && (
            <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Coach-only: delete whole conversation */}
          {account?.role === "coach" && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={deleteConversation}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                <Trash2 size={11} /> Delete conversation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
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

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import {
  fetchAllFeedbackForAthlete,
  markFeedbackRead,
  type FeedbackRow,
} from "../lib/feedbackSync";
import { useRealtime } from "../lib/useRealtime";
import { useStore } from "../lib/store";
import { ACCOUNT_ROLE_EMOJIS, ACCOUNT_ROLE_LABELS } from "../types";
import { ArrowLeft, MessageSquare, Check } from "lucide-react";

/**
 * Athlete's feedback inbox. Lists all notes left by coaches and parents,
 * newest first. Each note links to the relevant match or video. Viewing
 * marks notes as read.
 */
export default function FeedbackInboxPage() {
  const { user, account } = useAuth();
  const { state } = useStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const rows = await fetchAllFeedbackForAthlete(user.id);
    setItems(rows);
    setLoading(false);

    // Mark all unread notes from others as read
    const unread = rows
      .filter((r) => !r.read_at && r.author_id !== user.id)
      .map((r) => r.id);
    if (unread.length > 0) {
      window.setTimeout(() => {
        markFeedbackRead(unread);
      }, 1200);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime — new notes appear automatically, read/delete events too.
  useRealtime(
    {
      table: "feedback",
      filter: user ? `athlete_id=eq.${user.id}` : undefined,
      enabled: Boolean(user),
    },
    refresh
  );

  if (!account) return null;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center">
            <MessageSquare size={18} />
          </div>
          <h1 className="page-title">Coach &amp; Parent Notes</h1>
        </div>
        <p className="page-subtitle">
          {items.length} note{items.length === 1 ? "" : "s"} total
        </p>
      </header>

      {loading ? (
        <div className="card text-sm text-slate-500">Loading notes...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-10">
          <MessageSquare size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold mt-3 text-slate-900">No notes yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            When your coach or parent leaves you a note on a match or video,
            it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const isMine = user?.id === it.author_id;
            const matchTarget =
              it.target_type === "match"
                ? state.matches.find((m) => m.id === it.target_id)
                : null;
            const videoTarget =
              it.target_type === "video"
                ? state.videos.find((v) => v.id === it.target_id)
                : null;
            const contextLabel =
              matchTarget?.opponent
                ? `Match vs. ${matchTarget.opponent}`
                : videoTarget?.title
                ? `Video: ${videoTarget.title}`
                : it.target_type === "match"
                ? "A match"
                : it.target_type === "video"
                ? "A video"
                : "A practice";

            return (
              <button
                key={it.id}
                onClick={() => {
                  if (matchTarget) navigate(`/matches`);
                  else if (videoTarget) navigate(`/videos`);
                }}
                className={`w-full text-left card ${
                  !it.read_at && !isMine
                    ? "border-brand-300 bg-gradient-to-br from-brand-50 to-white"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 pt-0.5">
                    {ACCOUNT_ROLE_EMOJIS[it.author_role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {it.author_name || ACCOUNT_ROLE_LABELS[it.author_role]}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {ACCOUNT_ROLE_LABELS[it.author_role]}
                      </span>
                      {!it.read_at && !isMine && (
                        <span className="ml-auto text-[10px] font-bold text-brand-700 bg-brand-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          New
                        </span>
                      )}
                      {isMine && it.read_at && (
                        <span className="ml-auto text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check size={9} strokeWidth={3} /> Seen
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      on <span className="italic">{contextLabel}</span> ·{" "}
                      {formatDate(it.created_at)}
                    </div>
                    <p className="text-sm text-slate-800 mt-1.5 whitespace-pre-wrap leading-snug">
                      {it.text}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

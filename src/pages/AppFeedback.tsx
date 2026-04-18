import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  MessageCircle,
  Send,
  Check,
  Trash2,
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { supabase } from "../lib/supabase";

const APP_OWNER_ID = import.meta.env.VITE_APP_OWNER_ACCOUNT_ID as string | undefined;

type FeedbackType = "bug" | "idea" | "other";

interface FeedbackRow {
  id: string;
  feedback_type: FeedbackType;
  text: string;
  page: string | null;
  created_at: string;
  display_name: string | null;
  role: string | null;
}

const TYPES: Array<{
  key: FeedbackType;
  label: string;
  emoji: React.ReactNode;
  color: string;
  activeColor: string;
}> = [
  {
    key: "bug",
    label: "Bug",
    emoji: <Bug size={16} />,
    color: "border-slate-200 text-slate-600",
    activeColor: "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400",
  },
  {
    key: "idea",
    label: "Idea",
    emoji: <Lightbulb size={16} />,
    color: "border-slate-200 text-slate-600",
    activeColor: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-400",
  },
  {
    key: "other",
    label: "Other",
    emoji: <MessageCircle size={16} />,
    color: "border-slate-200 text-slate-600",
    activeColor: "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:border-brand-700 dark:text-brand-400",
  },
];

export default function AppFeedbackPage() {
  const { account, user, configured } = useAuth();
  const [type, setType] = useState<FeedbackType>("bug");
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<FeedbackRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!supabase || !user) {
      setLoadingHistory(false);
      return;
    }
    const { data, error: loadErr } = await supabase
      .from("app_feedback")
      .select("id, feedback_type, text, page, created_at, display_name, role")
      .order("created_at", { ascending: false })
      .limit(50);
    if (loadErr) {
      setHistoryError(loadErr.message);
      setLoadingHistory(false);
      return;
    }
    setHistoryError(null);
    setHistory((data ?? []) as FeedbackRow[]);
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const submit = async () => {
    if (!supabase || !user || !text.trim()) return;
    setSending(true);
    setError(null);
    const { error: err } = await supabase.from("app_feedback").insert({
      account_id: user.id,
      display_name: account?.displayName ?? null,
      role: account?.role ?? null,
      feedback_type: type,
      text: text.trim(),
      page: page.trim() || null,
    });
    setSending(false);
    if (err) {
      setError(err.message);
      return;
    }

    // Notify the app owner (fire-and-forget)
    if (APP_OWNER_ID && APP_OWNER_ID !== user.id) {
      const preview = text.trim().length > 80 ? text.trim().slice(0, 77) + "..." : text.trim();
      const typeLabel = type === "bug" ? "Bug report" : type === "idea" ? "New idea" : "Feedback";
      try {
        supabase.functions
          .invoke("send-push", {
            body: {
              toAccountId: APP_OWNER_ID,
            title: `${typeLabel} from ${account?.displayName ?? "a tester"}`,
            body: preview,
            url: "/app-feedback",
            tag: `app-feedback-${Date.now()}`,
          },
        })
        .then(() => {}, () => {});
      } catch {
        /* best-effort */
      }
    }
    setSent(true);
    setText("");
    setPage("");
    loadHistory();
    window.setTimeout(() => setSent(false), 2000);
  };

  const deleteFeedback = async (id: string) => {
    if (!supabase) return;
    const { error: delErr } = await supabase
      .from("app_feedback")
      .delete()
      .eq("id", id);
    if (delErr) {
      setHistoryError(`Couldn't delete: ${delErr.message}`);
      return;
    }
    loadHistory();
  };

  if (!configured || !user) {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} /> Settings
          </Link>
          <h1 className="page-title">App Feedback</h1>
        </header>
        <div className="card text-sm text-slate-600 dark:text-slate-400">
          Sign in to submit feedback.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-2"
        >
          <ArrowLeft size={16} /> Settings
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center">
            <MessageCircle size={18} />
          </div>
          <div>
            <h1 className="page-title">App Feedback</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Found a bug? Have an idea? Tell us here.
            </p>
          </div>
        </div>
      </header>

      <div className="card">
        <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          What kind of feedback?
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`py-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition ${
                type === t.key ? t.activeColor : t.color
              }`}
            >
              {t.emoji}
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              {type === "bug"
                ? "What happened? What did you expect?"
                : type === "idea"
                ? "What's your idea?"
                : "What's on your mind?"}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={
                type === "bug"
                  ? "I tapped the habits button and it didn't do anything..."
                  : type === "idea"
                  ? "It would be cool if the app could..."
                  : "Just wanted to say..."
              }
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <div className="text-right text-[10px] text-slate-400 mt-1">
              {text.length}/1000
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Which page were you on? (optional)
            </label>
            <input
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="e.g. Habits, Match Log, Dashboard"
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-600 font-medium">{error}</div>
        )}

        <button
          onClick={submit}
          disabled={!text.trim() || sending}
          className="btn-primary w-full mt-4 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {sent ? (
            <>
              <Check size={14} /> Sent — thank you!
            </>
          ) : sending ? (
            "Sending..."
          ) : (
            <>
              <Send size={14} /> Send feedback
            </>
          )}
        </button>
      </div>

      {/* Previous submissions */}
      {historyError && (
        <div className="card bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200 flex items-start justify-between gap-3">
          <div>{historyError}</div>
          <button
            onClick={() => setHistoryError(null)}
            className="text-xs font-bold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
      {loadingHistory ? (
        <div className="text-sm text-slate-400 dark:text-slate-500">Loading...</div>
      ) : history.length > 0 ? (
        <div>
          <h2 className="section-label mb-2 px-1">All feedback</h2>
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="card !p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          item.feedback_type === "bug"
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : item.feedback_type === "idea"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {item.feedback_type}
                      </span>
                      {item.display_name && (
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                          {item.display_name}
                          {item.role ? ` (${item.role})` : ""}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.page && (
                        <span className="text-[10px] text-slate-400">
                          · {item.page}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-snug">
                      {item.text}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteFeedback(item.id)}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Trash2,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useStore } from "../lib/store";
import { useRealtime } from "../lib/useRealtime";
import {
  askAiCoach,
  deleteConversation,
  fetchConversations,
  type Conversation,
} from "../lib/aiCoach";

/**
 * Phase 4F.3 — "Ask your AI coach" freeform Q&A.
 *
 * Athletes (and connected coaches/parents) can type any question and
 * get a grounded answer that pulls from the athlete's recent data.
 * All Q&A is stored and visible to the whole team so nothing is
 * hidden.
 */
export default function AskCoachPage() {
  const { configured, account, user } = useAuth();
  const { state } = useStore();
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Only athletes can see this right now (simpler scope for F.3)
  const athleteId = user?.id;

  const refresh = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);
    const rows = await fetchConversations(athleteId);
    setConversations(rows);
    setLoading(false);
  }, [athleteId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtime(
    {
      table: "ai_conversations",
      filter: athleteId ? `athlete_id=eq.${athleteId}` : undefined,
      enabled: Boolean(athleteId && configured),
    },
    refresh
  );

  if (!configured || !user || !account) {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <h1 className="page-title">Ask AI Coach</h1>
        </header>
        <div className="card text-sm text-slate-600">
          Sign in to your account to use AI Coach.
        </div>
      </div>
    );
  }

  if (account.role !== "athlete") {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <h1 className="page-title">Ask AI Coach</h1>
        </header>
        <div className="card text-sm text-slate-600">
          Ask-AI is available to athletes right now. Coach- and parent-side
          variants are planned.
        </div>
      </div>
    );
  }

  const submit = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setAsking(true);
    setError(null);
    const { error: err } = await askAiCoach({
      athleteId: user.id,
      question: trimmed,
    });
    setAsking(false);
    if (err) {
      setError(err);
      return;
    }
    setQuestion("");
    // Realtime will update the list — but do a quick refresh in case
    refresh();
    // Return focus to the input for a follow-up
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const starterQuestions = [
    "What should I focus on this week?",
    "How's my consistency looking?",
    "What's one habit I keep missing?",
    "What did I do best in my last match?",
  ];

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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="page-title">Ask AI Coach</h1>
            <p className="text-xs text-slate-500">
              Grounded in your last 30 days of data.
            </p>
          </div>
        </div>
      </header>

      {/* Safety note — always visible */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 text-xs flex items-start gap-2">
        <Shield size={14} className="mt-0.5 flex-shrink-0 text-slate-500" />
        <div>
          Your coach and parent can see these questions and answers too. AI
          Coach doesn&apos;t give medical, diet, or weight-cut advice — ask a
          real adult for those.
        </div>
      </div>

      {/* Composer */}
      <div className="card">
        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something about your training, mindset, or recent matches..."
          rows={3}
          maxLength={500}
          className="w-full text-sm bg-transparent resize-none focus:outline-none placeholder:text-slate-400"
          disabled={asking}
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 tabular-nums">
            {question.length}/500
          </span>
          <button
            onClick={submit}
            disabled={!question.trim() || asking}
            className="btn-primary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={12} />
            {asking ? "Thinking..." : "Ask"}
          </button>
        </div>
        {error && (
          <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 text-xs flex items-start gap-2">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Starter prompts — only shown with no history yet */}
      {!loading && conversations.length === 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2 px-1">
            Try something like
          </div>
          <div className="space-y-2">
            {starterQuestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  inputRef.current?.focus();
                }}
                className="w-full text-left card-interactive !py-2.5 text-sm text-slate-700"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {loading ? (
        <div className="card text-sm text-slate-500">Loading history…</div>
      ) : conversations.length > 0 ? (
        <div className="space-y-3">
          <h2 className="section-label mb-2 px-1">Recent</h2>
          {conversations.map((c) => (
            <ConversationCard
              key={c.id}
              c={c}
              canDelete={c.asker_id === user.id}
              athleteName={state.profile?.name}
            />
          ))}
        </div>
      ) : null}

      {state.profile && (
        <p className="text-[11px] text-slate-400 pt-2 pb-6 text-center">
          Up to 20 questions per day · answers grounded in your logged data
        </p>
      )}
    </div>
  );
}

function ConversationCard({
  c,
  canDelete,
  athleteName,
}: {
  c: Conversation;
  canDelete: boolean;
  athleteName?: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    await deleteConversation(c.id);
  };

  const asked = new Date(c.asked_at);
  const askerLabel =
    c.asker_role === "athlete"
      ? athleteName ?? "You"
      : c.asker_role === "coach"
      ? `Coach${c.asker_name ? " " + c.asker_name : ""}`
      : `Parent${c.asker_name ? " " + c.asker_name : ""}`;

  return (
    <div className="card space-y-3">
      {/* Question */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            {askerLabel} asked
          </div>
          <div className="text-[10px] text-slate-400">
            {asked.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </div>
        <p className="text-sm text-slate-900 mt-1 font-semibold leading-snug">
          {c.question}
        </p>
      </div>

      {/* Answer */}
      {c.answer ? (
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-purple-200 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={11} className="text-purple-600" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-purple-700">
              AI Coach
            </span>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {c.answer}
          </p>
        </div>
      ) : c.error ? (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 text-xs">
          Couldn&apos;t generate an answer: {c.error}
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 p-3 text-xs flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          Still thinking…
        </div>
      )}

      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[11px] text-slate-400 hover:text-red-600 font-semibold inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Trash2 size={10} /> {deleting ? "Deleting…" : "Delete"}
        </button>
      )}
    </div>
  );
}

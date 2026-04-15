import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw, MessageSquare, ChevronRight } from "lucide-react";
import { useAuth } from "../lib/authContext";
import {
  currentWeekMonday,
  fetchWeeklyWrapUp,
  readCachedWeeklyWrapUp,
  type AiInsight,
} from "../lib/aiCoach";
import { useRealtime } from "../lib/useRealtime";

/**
 * Phase 4F.1 — AI-generated weekly wrap-up card.
 *
 * On mount: read the cached insight (no API call). If there isn't one
 * yet and the athlete has used the app this week, offer a "Generate"
 * button that calls the edge function.
 */
export default function WeeklyWrapUpCard({
  athleteId,
}: {
  athleteId: string;
}) {
  const { configured } = useAuth();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekStart] = useState(() => currentWeekMonday());

  const loadCached = async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const cached = await readCachedWeeklyWrapUp(athleteId, weekStart);
    setInsight(cached);
    setLoading(false);
  };

  useEffect(() => {
    loadCached();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId, weekStart]);

  // Live-refresh if a coach / parent generates the same week's insight.
  useRealtime(
    {
      table: "ai_insights",
      filter: `athlete_id=eq.${athleteId}`,
      enabled: Boolean(athleteId && configured),
    },
    loadCached
  );

  const generate = async (refresh: boolean) => {
    setGenerating(true);
    setError(null);
    const { insight: fresh, error: err } = await fetchWeeklyWrapUp({
      athleteId,
      weekStart,
      refresh,
    });
    setGenerating(false);
    if (err) {
      setError(err);
      return;
    }
    if (fresh) setInsight(fresh);
  };

  if (!configured) return null;

  return (
    <div className="card bg-gradient-to-br from-indigo-50 via-purple-50 to-white border-purple-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-purple-700">
                AI Coach
              </div>
              <div className="font-bold text-slate-900">This week</div>
            </div>
            {insight && !generating && (
              <button
                onClick={() => generate(true)}
                className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
                title="Regenerate"
              >
                <RefreshCw size={10} /> Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-sm text-slate-400 mt-2">Loading…</div>
          ) : generating ? (
            <div className="text-sm text-slate-500 mt-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Thinking…
            </div>
          ) : insight ? (
            <>
              <p className="text-sm text-slate-800 mt-2 leading-relaxed whitespace-pre-wrap">
                {insight.content}
              </p>
              <div className="text-[10px] text-slate-400 mt-2">
                Generated {formatRel(insight.generatedAt)}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-600 mt-2 leading-snug">
                Get a personalized summary of your week — wins, patterns, and
                one small suggestion.
              </p>
              <button
                onClick={() => generate(false)}
                className="btn-primary mt-3 !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
              >
                <Sparkles size={12} /> Generate this week&apos;s recap
              </button>
            </>
          )}

          {error && (
            <div className="text-xs text-red-600 mt-2 font-medium">
              {error}
            </div>
          )}

          <Link
            to="/ask"
            className="mt-3 -mx-3 -mb-3 px-3 py-2 border-t border-purple-200/70 flex items-center gap-2 text-xs font-semibold text-purple-700 hover:bg-purple-50/60 rounded-b-2xl"
          >
            <MessageSquare size={12} />
            <span className="flex-1">Ask AI Coach a question</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatRel(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60_000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

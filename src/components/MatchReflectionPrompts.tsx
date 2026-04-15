import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "../lib/authContext";
import {
  fetchReflectionPrompts,
  readCachedInsight,
  type AiInsight,
} from "../lib/aiCoach";
import { isUuid } from "../lib/store";

/**
 * Phase 4F.2 — AI-generated post-match reflection prompts.
 *
 * Shows up on the MatchDetail page once post-match reflection is
 * complete. Cached per match id so the prompts stay stable unless
 * the athlete explicitly refreshes.
 */
export default function MatchReflectionPrompts({
  athleteId,
  matchId,
}: {
  athleteId: string;
  matchId: string;
}) {
  const { configured } = useAuth();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !isUuid(matchId)) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const cached = await readCachedInsight(
        athleteId,
        "reflection-prompts",
        matchId
      );
      setInsight(cached);
      setLoading(false);
    })();
  }, [athleteId, matchId, configured]);

  const generate = async (refresh: boolean) => {
    setGenerating(true);
    setError(null);
    const { insight: fresh, error: err } = await fetchReflectionPrompts({
      athleteId,
      matchId,
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
  if (!isUuid(matchId)) return null; // only sync-compatible matches

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
              <div className="font-bold text-slate-900">Go deeper</div>
            </div>
            {insight && !generating && (
              <button
                onClick={() => generate(true)}
                className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
              >
                <RefreshCw size={10} /> New questions
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
            <div className="text-sm text-slate-800 mt-2 leading-relaxed whitespace-pre-wrap">
              {insight.content}
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 mt-2 leading-snug">
                Want to think about this match a little more? Get 3-4 open
                questions tailored to what just happened.
              </p>
              <button
                onClick={() => generate(false)}
                className="btn-primary mt-3 !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
              >
                <Sparkles size={12} /> Generate reflection questions
              </button>
            </>
          )}

          {error && (
            <div className="text-xs text-red-600 mt-2 font-medium">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { currentWeekMondayISO } from "../lib/gamification";
import { showReward } from "../components/RewardToast";
import {
  ArrowLeft,
  Calendar,
  Trophy,
  AlertCircle,
  Lightbulb,
  Target,
  Sparkles,
  Check,
} from "lucide-react";

export default function WeeklyReviewPage() {
  const { state, saveWeeklyReview } = useStore();
  const thisWeek = currentWeekMondayISO();
  const existing = state.weeklyReviews.find(
    (r) => r.weekStartDate === thisWeek
  );

  const [win1, setWin1] = useState(existing?.wins?.[0] ?? "");
  const [win2, setWin2] = useState(existing?.wins?.[1] ?? "");
  const [win3, setWin3] = useState(existing?.wins?.[2] ?? "");
  const [challenge, setChallenge] = useState(existing?.challenge ?? "");
  const [learned, setLearned] = useState(existing?.learned ?? "");
  const [nextGoal, setNextGoal] = useState(existing?.nextWeekGoal ?? "");

  const past = [...state.weeklyReviews]
    .filter((r) => r.weekStartDate !== thisWeek)
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
    .slice(0, 10);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const { awardedXp, newlyUnlocked } = saveWeeklyReview({
      weekStartDate: thisWeek,
      wins: [win1.trim(), win2.trim(), win3.trim()],
      challenge: challenge.trim(),
      learned: learned.trim(),
      nextWeekGoal: nextGoal.trim(),
    });
    if (awardedXp > 0 || newlyUnlocked.length) {
      showReward(awardedXp, newlyUnlocked);
    }
  }

  const weekLabel = formatWeekLabel(thisWeek);

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
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <h1 className="page-title">Weekly Review</h1>
        </div>
        <p className="page-subtitle">
          Sunday-night style reflection. {weekLabel}.
        </p>
      </header>

      {existing && (
        <div className="card bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-700">
            <Check size={16} strokeWidth={3} />
            <span className="font-bold text-sm">
              Reviewed this week — edit below if you want
            </span>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="font-bold text-slate-900 text-sm">
              3 Wins From This Week
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Process wins count — not just outcomes. "Got to practice early
            every day" beats "won the tournament."
          </p>
          <div className="space-y-2">
            {[
              [win1, setWin1, "e.g. Showed up early to all 4 practices"],
              [win2, setWin2, "e.g. Hit every drill 100% — no half reps"],
              [win3, setWin3, "e.g. Stayed off the phone 1 hour before bed"],
            ].map(([val, set, placeholder], i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="mt-2.5 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <input
                  value={val as string}
                  onChange={(e) => (set as (s: string) => void)(e.target.value)}
                  placeholder={placeholder as string}
                  className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-amber-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-red-500" />
            <h2 className="font-bold text-slate-900 text-sm">
              One challenge you faced
            </h2>
          </div>
          <textarea
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            rows={2}
            placeholder="What was hard this week? A tough practice, a bad mindset day, a matchup you struggled with?"
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
          />
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-amber-500" />
            <h2 className="font-bold text-slate-900 text-sm">
              One thing you learned
            </h2>
          </div>
          <textarea
            value={learned}
            onChange={(e) => setLearned(e.target.value)}
            rows={2}
            placeholder="Could be about your sport, your body, your mind, or yourself."
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
          />
        </div>

        <div className="card bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-brand-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              Top goal for next week
            </h2>
          </div>
          <textarea
            value={nextGoal}
            onChange={(e) => setNextGoal(e.target.value)}
            rows={2}
            placeholder="One concrete thing you'll focus on. Process goal beats outcome goal."
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm transition active:scale-[0.97] shadow-md"
        >
          {existing ? (
            "Save Changes"
          ) : (
            <>
              <Sparkles size={14} className="inline mr-1" />
              Complete Weekly Review +50 XP
            </>
          )}
        </button>
      </form>

      {past.length > 0 && (
        <section>
          <h2 className="section-label mb-2 px-1">Past Reviews</h2>
          <div className="space-y-2">
            {past.map((r) => (
              <div key={r.id} className="card !p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {formatWeekLabel(r.weekStartDate)}
                </div>
                {r.wins.filter(Boolean).length > 0 && (
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="text-amber-600 font-bold">Wins: </span>
                    {r.wins.filter(Boolean).join(" · ")}
                  </div>
                )}
                {r.nextWeekGoal && (
                  <div className="mt-1 text-sm text-slate-700">
                    <span className="text-brand-600 font-bold">
                      Next goal:{" "}
                    </span>
                    {r.nextWeekGoal}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatWeekLabel(weekStartIso: string): string {
  const d = new Date(weekStartIso + "T00:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = (x: Date) =>
    x.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `Week of ${fmt(d)} – ${fmt(end)}`;
}

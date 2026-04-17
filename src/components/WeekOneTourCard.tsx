import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { useStore } from "../lib/store";
import {
  pickTourDay,
  dismissDay,
  TOUR_DAYS,
} from "../lib/weekOneTour";
import { hapticLight } from "../lib/haptics";

/**
 * Surfaces ONE onboarding tip per day for the athlete's first week.
 * Auto-hides on day 8+ or after dismissal. Progression is anchored to
 * `profile.createdAt` so it just works — no extra tracking state.
 */
export default function WeekOneTourCard() {
  const { state } = useStore();
  const [dismissed, setDismissed] = useState(false);

  const tourDay = useMemo(() => {
    if (dismissed) return null;
    return pickTourDay(state.profile?.createdAt);
  }, [state.profile?.createdAt, dismissed]);

  if (!tourDay) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticLight();
    dismissDay(tourDay.day);
    setDismissed(true);
  };

  return (
    <Link
      to={tourDay.ctaPath}
      onClick={() => hapticLight()}
      className={`relative block overflow-hidden rounded-2xl bg-gradient-to-br ${tourDay.gradient} text-white p-4 shadow-elevated group animate-pop-in`}
    >
      {/* dismiss X */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/80 z-10"
        aria-label="Dismiss for today"
      >
        <X size={14} />
      </button>

      {/* soft blur accents */}
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative flex items-start gap-3 pr-8">
        <div className="text-4xl flex-shrink-0 leading-none mt-0.5">
          {tourDay.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-white/75 mb-1">
            <span>Week 1 Tour</span>
            <span className="opacity-50">·</span>
            <span>{tourDay.day}/7</span>
          </div>
          <div className="text-lg font-extrabold tracking-tight leading-tight">
            {tourDay.title.replace(/^Day \d+ — /, "")}
          </div>
          <p className="text-sm text-white/90 mt-1.5 leading-snug">
            {tourDay.blurb}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-extrabold group-active:scale-95 transition">
            {tourDay.ctaLabel}
            <ArrowRight size={13} />
          </div>
        </div>
      </div>

      {/* day progress dots */}
      <div className="relative mt-4 flex items-center gap-1">
        {TOUR_DAYS.map((d) => (
          <div
            key={d.day}
            className={`h-1 flex-1 rounded-full transition-all ${
              d.day < tourDay.day
                ? "bg-white/60"
                : d.day === tourDay.day
                ? "bg-white"
                : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </Link>
  );
}

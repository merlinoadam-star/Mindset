import { useStore } from "../lib/store";
import { getQuoteForDate } from "../lib/quotes";
import { todayISO } from "../lib/gamification";
import { showReward } from "./RewardToast";
import { Quote as QuoteIcon, BookOpen, Check } from "lucide-react";

export default function QuoteOfTheDay() {
  const { state, hasClaimedQuoteToday, claimDailyQuote } = useStore();
  if (!state.profile) return null;

  const quote = getQuoteForDate(state.profile.sport, todayISO());

  function handleClaim() {
    const { awardedXp, newlyUnlocked, alreadyClaimed } = claimDailyQuote();
    if (!alreadyClaimed) {
      showReward(awardedXp, newlyUnlocked);
    }
  }

  return (
    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="text-xs uppercase tracking-[0.2em] text-amber-800 font-bold mb-3">
        Daily Wisdom
      </div>

      {/* Quote of the Day */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <QuoteIcon size={18} className="text-amber-700" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <blockquote className="text-[15px] text-slate-800 leading-snug font-semibold">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          {quote.author && (
            <div className="mt-1.5 text-xs text-slate-600 font-medium">
              — {quote.author}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-amber-200" />

      {/* Verse of the Day */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BookOpen size={18} className="text-amber-700" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <blockquote className="text-sm text-slate-700 leading-snug italic">
            &ldquo;{quote.verse.text}&rdquo;
          </blockquote>
          <div className="mt-1.5 text-xs text-amber-800 font-bold">
            {quote.verse.reference}
          </div>
        </div>
      </div>

      {/* Claim button */}
      <div className="mt-4">
        {hasClaimedQuoteToday ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-100 text-green-800 font-semibold text-sm">
            <Check size={16} strokeWidth={3} />
            Claimed today — come back tomorrow
          </div>
        ) : (
          <button
            onClick={handleClaim}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition active:scale-95"
          >
            Claim today&apos;s wisdom +10 XP
          </button>
        )}
      </div>
    </div>
  );
}

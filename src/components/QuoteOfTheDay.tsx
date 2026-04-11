import { useStore } from "../lib/store";
import { getQuoteForDate } from "../lib/quotes";
import { todayISO } from "../lib/gamification";
import { showReward } from "./RewardToast";
import { Quote as QuoteIcon, Check } from "lucide-react";

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
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
          <QuoteIcon size={20} className="text-amber-700" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-amber-800 font-bold">
            Quote of the Day
          </div>
          <blockquote className="mt-1.5 text-[15px] text-slate-800 leading-snug font-semibold">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          {quote.author && (
            <div className="mt-2 text-xs text-slate-600 font-medium">
              — {quote.author}
            </div>
          )}
        </div>
      </div>

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

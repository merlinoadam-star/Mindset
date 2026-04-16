import { useStore } from "../lib/store";
import { getQuoteForDate } from "../lib/quotes";
import { todayISO } from "../lib/gamification";
import { showReward } from "./RewardToast";
import SpeakButton from "./SpeakButton";
import { Quote as QuoteIcon, BookOpen, Check, Sparkles } from "lucide-react";

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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/60 p-5 shadow-card">
      {/* Decorative dots */}
      <div className="absolute top-3 right-3 w-16 h-16 rounded-full bg-amber-200/20" />
      <div className="absolute bottom-6 right-8 w-8 h-8 rounded-full bg-orange-200/20" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-600" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-700">
              Your Daily Fire
            </span>
          </div>
          <SpeakButton
            text={
              `Quote of the day. ${quote.text}` +
              (quote.author ? `. By ${quote.author}.` : ".") +
              ` Verse of the day. ${quote.verse.text} From ${quote.verse.reference}.`
            }
            size="sm"
            rate={0.95}
          />
        </div>

        {/* Quote */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <QuoteIcon size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <blockquote className="text-[15px] text-slate-800 leading-snug font-semibold">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            {quote.author && (
              <div className="mt-1.5 text-xs text-slate-500 font-medium">
                — {quote.author}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-3.5 border-t border-amber-200/50" />

        {/* Verse */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen size={16} className="text-amber-700" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <blockquote className="text-sm text-slate-600 leading-snug italic">
              &ldquo;{quote.verse.text}&rdquo;
            </blockquote>
            <div className="mt-1.5 text-xs text-amber-800 font-bold">
              {quote.verse.reference}
            </div>
          </div>
        </div>

        {/* Claim */}
        <div className="mt-4">
          {hasClaimedQuoteToday ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-100/80 text-green-700 font-semibold text-sm border border-green-200/50">
              <Check size={16} strokeWidth={3} />
              Claimed — come back tomorrow
            </div>
          ) : (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm transition-all duration-200 active:scale-[0.97] shadow-md hover:shadow-lg"
            >
              Claim today&apos;s wisdom +10 XP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

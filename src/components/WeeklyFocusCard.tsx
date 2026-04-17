import { useEffect, useState } from "react";
import { Target, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useRealtime } from "../lib/useRealtime";
import {
  fetchWeeklyFocus,
  mondayOf,
  type WeeklyFocusRow,
} from "../lib/weeklyFocusSync";
import {
  getSkillById,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "../lib/skillCatalog";

/**
 * Dashboard card that shows the athlete whatever weekly focus their
 * connected coach / parent has set for this week. Silently hides if
 * no focus is set or the athlete isn't signed in with sync.
 *
 * If the coach picked a skill from the catalog, renders a rich card
 * with category color, emoji, and expandable "how to work on it"
 * actions. Otherwise falls back to the old plain-text card.
 */
export default function WeeklyFocusCard() {
  const { account } = useAuth();
  const [row, setRow] = useState<WeeklyFocusRow | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    if (!account || account.role !== "athlete") {
      setRow(null);
      return;
    }
    const r = await fetchWeeklyFocus(account.id);
    setRow(r);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  useRealtime(
    {
      table: "weekly_focus",
      filter:
        account && account.role === "athlete"
          ? `athlete_id=eq.${account.id}`
          : undefined,
      enabled: Boolean(account && account.role === "athlete"),
    },
    load
  );

  if (!row) return null;

  const roleLabel =
    row.author_role === "coach"
      ? "Coach"
      : row.author_role === "parent"
      ? "Parent"
      : "You";
  const byLine = row.author_name
    ? `${roleLabel} ${row.author_name}`
    : roleLabel;

  const skill = getSkillById(row.skill_id);

  // Rich card — coach picked from catalog
  if (skill) {
    const tint = CATEGORY_COLORS[skill.category];
    return (
      <div
        className={`card bg-gradient-to-br ${tint.bg} ${tint.border}`}
      >
        <div className="flex items-start gap-3">
          <div className="text-4xl flex-shrink-0 leading-none mt-0.5">
            {skill.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-[10px] uppercase tracking-[0.15em] font-bold ${tint.text} flex items-center gap-1.5`}>
              <Target size={10} />
              <span>This Week's Focus</span>
              <span className="opacity-50">·</span>
              <span>{CATEGORY_LABELS[skill.category]}</span>
            </div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5 leading-tight">
              {skill.title}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-snug">
              {row.text || skill.blurb}
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
              From {byLine} · Week of {formatWeek(row.week_start_date)}
            </div>
          </div>
        </div>

        {skill.actions.length > 0 && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className={`mt-3 inline-flex items-center gap-1 text-[11px] font-bold ${tint.text} hover:opacity-80`}
            >
              {expanded ? (
                <>
                  Hide ideas <ChevronUp size={12} />
                </>
              ) : (
                <>
                  How to work on it <ChevronDown size={12} />
                </>
              )}
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1 animate-slide-up">
                {skill.actions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className={`inline-block w-5 h-5 rounded-full ${tint.accent} text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {i + 1}
                    </span>
                    <span className="leading-snug">{action}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    );
  }

  // Plain-text fallback — coach wrote free-text, no catalog skill chosen
  return (
    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950 dark:to-orange-950 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
          <Target size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">
            This Week&apos;s Focus
          </div>
          <div className="font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
            {row.text}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            From {byLine} · Week of {formatWeek(row.week_start_date)}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatWeek(monday: string): string {
  try {
    const d = new Date(monday + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return monday;
  }
}

export { mondayOf };

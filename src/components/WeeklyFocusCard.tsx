import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useRealtime } from "../lib/useRealtime";
import {
  fetchWeeklyFocus,
  mondayOf,
  type WeeklyFocusRow,
} from "../lib/weeklyFocusSync";

/**
 * Dashboard card that shows the athlete whatever weekly focus their
 * connected coach / parent has set for this week. Silently hides if
 * no focus is set or the athlete isn't signed in with sync.
 */
export default function WeeklyFocusCard() {
  const { account } = useAuth();
  const [row, setRow] = useState<WeeklyFocusRow | null>(null);

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

  // Live update when the coach saves a new focus while the athlete is on the dashboard.
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

  return (
    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
          <Target size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
            This Week&apos;s Focus
          </div>
          <div className="font-bold text-slate-900 mt-0.5 leading-snug">
            {row.text}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
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

// Re-export helpers for components that need them
export { mondayOf };

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import {
  buildTimeline,
  groupByMonth,
  timelineStats,
  type TimelineEvent,
  type TimelineWindow,
} from "../lib/timeline";

/**
 * "This season so far" — a scrollable vertical timeline built from the
 * data already in state. Matches (with W/L/T), new personal records,
 * loss-recovery completions, badges, tournaments, awards, and video
 * uploads. Read-only. Each event deep-links to its source.
 */

const WINDOW_OPTIONS: Array<{ value: TimelineWindow; label: string }> = [
  { value: "30d", label: "Last 30d" },
  { value: "90d", label: "Last 90d" },
  { value: "all", label: "All time" },
];

export default function TimelinePage() {
  const { state } = useStore();
  const [win, setWin] = useState<TimelineWindow>("90d");

  const events = useMemo(() => buildTimeline(state, win), [state, win]);
  const stats = useMemo(() => timelineStats(events), [events]);
  const groups = useMemo(() => groupByMonth(events), [events]);

  if (!state.profile) return null;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2"
        >
          <ArrowLeft size={16} /> Profile
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div>
            <h1 className="page-title">Your Season</h1>
            <p className="page-subtitle">
              Matches, records, milestones — your arc.
            </p>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        <StatTile label="Events" value={stats.totalEvents} tone="slate" />
        <StatTile label="Wins" value={stats.wins} tone="emerald" />
        <StatTile label="PRs" value={stats.newPRs} tone="amber" />
        <StatTile label="Badges" value={stats.badges} tone="purple" />
      </div>

      {/* Window filter */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
        {WINDOW_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setWin(o.value)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              win === o.value
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState window={win} />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="section-label mb-2 px-1">{group.label}</h2>
              <div className="relative pl-7">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-3">
                  {group.events.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event row
// ---------------------------------------------------------------------------
function EventRow({ event }: { event: TimelineEvent }) {
  const navigate = useNavigate();
  const clickable = Boolean(event.linkTo);
  const Tag = clickable ? "button" : "div";
  const baseCls =
    "block w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 shadow-card transition";
  const interactCls = clickable
    ? "hover:border-slate-300 dark:hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
    : "";

  const dotCls = accentDotClass(event.accent);

  return (
    <div className="relative">
      {/* Dot on the rail */}
      <div
        className={`absolute -left-[14px] top-4 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${dotCls}`}
      />
      <Tag
        onClick={
          clickable
            ? () => {
                navigate(event.linkTo!);
              }
            : undefined
        }
        className={`${baseCls} ${interactCls}`}
      >
        <div className="flex items-start gap-2.5">
          <span className="text-lg leading-none pt-0.5" aria-hidden="true">
            {event.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
              {event.title}
            </div>
            {event.subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                {event.subtitle}
              </div>
            )}
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mt-1">
              {formatDate(event.date)}
            </div>
          </div>
        </div>
      </Tag>
    </div>
  );
}

function accentDotClass(accent: TimelineEvent["accent"]): string {
  switch (accent) {
    case "amber":
      return "bg-amber-400";
    case "indigo":
      return "bg-indigo-500";
    case "emerald":
      return "bg-emerald-500";
    case "rose":
      return "bg-rose-500";
    case "purple":
      return "bg-purple-500";
    case "sky":
      return "bg-sky-500";
    case "brand":
      return "bg-brand-500";
    default:
      return "bg-slate-400";
  }
}

// ---------------------------------------------------------------------------
// Empty + stat tile
// ---------------------------------------------------------------------------

function EmptyState({ window }: { window: TimelineWindow }) {
  const windowLabel =
    window === "30d"
      ? "the last 30 days"
      : window === "90d"
      ? "the last 90 days"
      : "your history";
  return (
    <div className="card text-center py-10">
      <Sparkles size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
      <h3 className="font-bold mt-3 text-slate-900 dark:text-slate-100">
        Nothing here yet
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
        No matches, PRs, or milestones in {windowLabel}. Log something — it
        starts showing up here automatically.
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "purple";
}) {
  const valueTone =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "purple"
      ? "text-purple-600 dark:text-purple-400"
      : "text-slate-900 dark:text-slate-100";
  return (
    <div className="card !p-3 text-center">
      <div className={`text-2xl font-extrabold tabular-nums ${valueTone}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { isUnlocked } from "../lib/unlocks";
import {
  BADGES,
  computeLevel,
  computeStreak,
  getBadge,
} from "../lib/gamification";
import {
  COMPETITION_TYPE_EMOJIS,
  COMPETITION_TYPE_LABELS,
  VOLLEYBALL_POSITION_LABELS,
  WRESTLING_STYLE_LABELS,
  formatHeight,
} from "../lib/profileOptions";
import {
  WRESTLING_WIN_TYPE_LABELS,
  type CompetitionType,
  type VolleyballPosition,
  type WrestlingStyle,
} from "../types";
import {
  ArrowLeft,
  Printer,
  FileDown,
  Eye,
  EyeOff,
  Medal,
  Trophy,
  Target,
  Zap,
  BarChart3,
  CheckSquare,
  Dumbbell,
  Swords,
  Award as AwardIcon,
  Calendar,
  Flame,
} from "lucide-react";

interface SectionToggle {
  key: keyof SectionState;
  label: string;
  default?: boolean;
}

interface SectionState {
  overview: boolean;
  about: boolean;
  sportDetails: boolean;
  seasonStats: boolean;
  competitions: boolean;
  awards: boolean;
  goals: boolean;
  matches: boolean;
  practices: boolean;
  badges: boolean;
}

const SECTION_TOGGLES: SectionToggle[] = [
  { key: "overview", label: "Overview (Level · XP · Streak)" },
  { key: "about", label: "About Me" },
  { key: "sportDetails", label: "Sport Details" },
  { key: "seasonStats", label: "Season Stats" },
  { key: "competitions", label: "Competitions & Events" },
  { key: "awards", label: "Awards & Accolades" },
  { key: "goals", label: "Goals & Self-Reflection" },
  { key: "matches", label: "Match Log" },
  { key: "practices", label: "Training Consistency" },
  { key: "badges", label: "Badges Earned" },
];

export default function ExportReportPage() {
  const { state } = useStore();
  const [sections, setSections] = useState<SectionState>({
    overview: true,
    about: true,
    sportDetails: true,
    seasonStats: true,
    competitions: true,
    awards: true,
    goals: true,
    matches: true,
    practices: true,
    badges: true,
  });

  function printNow() {
    document.body.classList.add("printing");
    // Let the browser re-render, then trigger print
    requestAnimationFrame(() => {
      window.print();
    });
  }

  useEffect(() => {
    const cleanup = () => document.body.classList.remove("printing");
    window.addEventListener("afterprint", cleanup);
    return () => {
      window.removeEventListener("afterprint", cleanup);
      document.body.classList.remove("printing");
    };
  }, []);

  if (!state.profile) return null;

  const p = state.profile;
  const info = computeLevel(state.xp, p.sport);

  // Level gate — Export Report unlocks at Lvl 6.
  if (!isUnlocked("tool.export", info.level)) {
    return <Navigate to="/" replace />;
  }
  const streak = computeStreak(state);
  const now = new Date();
  const generatedDate = now.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const matchesSorted = [...state.matches].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const wins = state.matches.filter((m) => m.result === "win").length;
  const losses = state.matches.filter((m) => m.result === "loss").length;
  const ties = state.matches.filter((m) => m.result === "tie").length;
  const pins = state.matches.filter(
    (m) => m.result === "win" && m.wrestling?.winType === "pin"
  ).length;

  const tournamentsSorted = [...(p.tournaments ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return a.name.localeCompare(b.name);
  });
  const awardsSorted = [...(p.awards ?? [])].sort(
    (a, b) => b.year - a.year
  );

  const totalPractices = state.practices.length;
  const totalHabits = state.habitCompletions.length;
  const totalCheckins = state.checkins.length;
  const unlockedBadges = state.unlockedBadges
    .map((b) => ({ ub: b, def: getBadge(b.id) }))
    .filter((x) => x.def)
    .sort((a, b) => b.ub.unlockedAt.localeCompare(a.ub.unlockedAt));

  return (
    <>
      {/* Controls — hidden when printing */}
      <div className="hide-in-print space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} /> Settings
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center">
              <FileDown size={18} />
            </div>
            <h1 className="page-title">Export Report</h1>
          </div>
          <p className="page-subtitle">
            A print-ready season summary. Save as PDF or print.
          </p>
        </header>

        <div className="card">
          <h2 className="font-bold text-slate-900 mb-3">Include in report</h2>
          <div className="space-y-2">
            {SECTION_TOGGLES.map((t) => {
              const on = sections[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() =>
                    setSections((s) => ({ ...s, [t.key]: !on }))
                  }
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    {t.label}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      on
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {on ? <Eye size={12} /> : <EyeOff size={12} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={printNow}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Printer size={18} /> Save as PDF / Print
        </button>
        <p className="text-xs text-slate-500 text-center">
          Your browser&apos;s print dialog will let you choose&nbsp;
          <strong>&ldquo;Save as PDF&rdquo;</strong> as the destination.
        </p>
      </div>

      {/* Printable content */}
      <div className="print-root mt-6 bg-white">
        <PrintStyles />

        {/* ---------- Cover header ---------- */}
        <div className="avoid-break border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500">
                Fearless · Athlete Report
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
                {p.name} {p.lastName ?? ""}
              </h1>
              <div className="text-sm text-slate-600 mt-1 capitalize">
                {p.sport} ·{" "}
                {p.grade === "K" ? "Kindergarten" : `Grade ${p.grade}`} · Age{" "}
                {p.age}
                {p.teamName && ` · ${p.teamName}`}
              </div>
              {p.coachName && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Coach {p.coachName}
                  {p.hometown && ` · ${p.hometown}`}
                </div>
              )}
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <div>Generated</div>
              <div className="font-bold text-slate-700">{generatedDate}</div>
            </div>
          </div>
        </div>

        {/* ---------- Overview ---------- */}
        {sections.overview && (
          <Section icon={<Zap size={14} />} title="Overview">
            <div className="grid grid-cols-4 gap-3">
              <Stat
                label="Level"
                value={`${info.level}`}
                sub={info.title}
                accent="text-brand-700"
              />
              <Stat
                label="Total XP"
                value={state.xp.toLocaleString()}
                sub="Earned"
              />
              <Stat
                label="Streak"
                value={`${streak}d`}
                sub="Consecutive days"
                accent={streak > 0 ? "text-orange-600" : "text-slate-500"}
                icon={<Flame size={12} />}
              />
              <Stat
                label="Record"
                value={`${wins}-${losses}${ties > 0 ? `-${ties}` : ""}`}
                sub={`${state.matches.length} match${state.matches.length === 1 ? "" : "es"}`}
                accent="text-green-700"
              />
            </div>
          </Section>
        )}

        {/* ---------- About ---------- */}
        {sections.about && (
          <Section icon={<CheckSquare size={14} />} title="About Me">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <Row label="Height" value={formatHeight(p.heightInches)} />
              <Row
                label="Weight"
                value={p.weightLbs ? `${p.weightLbs} lbs` : ""}
              />
              <Row label="Grade" value={p.grade} />
              <Row label="Age" value={`${p.age}`} />
              <Row
                label="Years Playing"
                value={
                  p.yearsPlaying != null ? `${p.yearsPlaying}` : ""
                }
              />
              <Row label="Jersey #" value={p.jerseyNumber} />
              <Row label="Team / Club" value={p.teamName} />
              <Row label="Coach" value={p.coachName} />
              <Row label="Hometown" value={p.hometown} />
            </div>
          </Section>
        )}

        {/* ---------- Sport-specific details ---------- */}
        {sections.sportDetails && (
          <Section
            icon={<Dumbbell size={14} />}
            title={
              p.sport === "wrestling"
                ? "Wrestling Details"
                : "Volleyball Details"
            }
          >
            {p.sport === "wrestling" ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <Row
                  label="Weight Class"
                  value={p.weightClass ? `${p.weightClass} lbs` : ""}
                />
                <Row
                  label="Styles"
                  value={
                    p.wrestlingStyles
                      ?.map(
                        (s) => WRESTLING_STYLE_LABELS[s as WrestlingStyle]
                      )
                      .join(", ") ?? ""
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <Row
                  label="Primary Position"
                  value={
                    p.primaryPosition
                      ? VOLLEYBALL_POSITION_LABELS[
                          p.primaryPosition as VolleyballPosition
                        ]
                      : ""
                  }
                />
                <Row
                  label="Secondary Position"
                  value={
                    p.secondaryPosition
                      ? VOLLEYBALL_POSITION_LABELS[
                          p.secondaryPosition as VolleyballPosition
                        ]
                      : ""
                  }
                />
                <Row
                  label="Dominant Hand"
                  value={p.dominantHand}
                />
                <Row
                  label="Vertical Jump"
                  value={p.verticalJumpInches ? `${p.verticalJumpInches}"` : ""}
                />
                <Row
                  label="Approach Jump"
                  value={p.approachJumpInches ? `${p.approachJumpInches}"` : ""}
                />
              </div>
            )}
          </Section>
        )}

        {/* ---------- Season Stats ---------- */}
        {sections.seasonStats && (
          <Section icon={<BarChart3 size={14} />} title="Season Stats">
            {p.sport === "wrestling" && p.wrestlingStats ? (
              <div className="grid grid-cols-5 gap-3">
                <Stat label="Season" value={p.wrestlingStats.season ?? "—"} />
                <Stat label="W-L" value={`${p.wrestlingStats.wins ?? 0}-${p.wrestlingStats.losses ?? 0}`} />
                <Stat label="Pins" value={`${p.wrestlingStats.pins ?? 0}`} />
                <Stat label="Tech" value={`${p.wrestlingStats.techFalls ?? 0}`} />
                <Stat label="Major" value={`${p.wrestlingStats.majorDecisions ?? 0}`} />
              </div>
            ) : p.sport === "volleyball" && p.volleyballStats ? (
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Season" value={p.volleyballStats.season ?? "—"} />
                <Stat label="Matches" value={`${p.volleyballStats.matchesPlayed ?? 0}`} />
                <Stat label="Kills" value={`${p.volleyballStats.kills ?? 0}`} />
                <Stat label="Digs" value={`${p.volleyballStats.digs ?? 0}`} />
                <Stat label="Assists" value={`${p.volleyballStats.assists ?? 0}`} />
                <Stat label="Blocks" value={`${p.volleyballStats.blocks ?? 0}`} />
                <Stat label="Aces" value={`${p.volleyballStats.aces ?? 0}`} />
                <Stat label="Hit %" value={p.volleyballStats.hittingPct != null ? p.volleyballStats.hittingPct.toFixed(3) : "—"} />
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No stats logged yet.</p>
            )}

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Head-to-Head (from match log)
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <Stat label="Wins" value={`${wins}`} accent="text-green-700" />
                <Stat label="Losses" value={`${losses}`} accent="text-red-600" />
                <Stat label="Ties" value={`${ties}`} />
                <Stat label="Pins" value={`${pins}`} />
              </div>
            </div>
          </Section>
        )}

        {/* ---------- Competitions & Events ---------- */}
        {sections.competitions && tournamentsSorted.length > 0 && (
          <Section icon={<Trophy size={14} />} title="Competitions & Events">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-300 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-1.5 pr-2">Type</th>
                  <th className="py-1.5 pr-2">Event</th>
                  <th className="py-1.5 pr-2">Year</th>
                  <th className="py-1.5">Result</th>
                </tr>
              </thead>
              <tbody>
                {tournamentsSorted.map((t) => {
                  const entryType = (t.type ?? "tournament") as CompetitionType;
                  return (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2">
                        {COMPETITION_TYPE_EMOJIS[entryType]}{" "}
                        <span className="text-xs text-slate-500">
                          {COMPETITION_TYPE_LABELS[entryType]}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 font-semibold">{t.name}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{t.year}</td>
                      <td className="py-1.5 font-semibold">{t.result}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        )}

        {/* ---------- Awards ---------- */}
        {sections.awards && awardsSorted.length > 0 && (
          <Section icon={<Medal size={14} />} title="Awards & Accolades">
            <ul className="space-y-1 text-sm">
              {awardsSorted.map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <AwardIcon
                    size={12}
                    className="text-amber-600 mt-1 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <span className="font-semibold">{a.name}</span>{" "}
                    <span className="text-slate-500">· {a.year}</span>
                    {a.note && (
                      <span className="text-slate-500 italic">
                        {" "}
                        — {a.note}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ---------- Goals ---------- */}
        {sections.goals && p.goals && (
          <Section icon={<Target size={14} />} title="Goals & Self-Reflection">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <GoalBlock
                label="Process — This Week"
                value={p.goals.processWeek ?? p.goals.shortTerm}
              />
              <GoalBlock
                label="Process — This Season"
                value={p.goals.processSeason}
              />
              <GoalBlock
                label="Outcome — This Season"
                value={p.goals.outcomeSeason ?? p.goals.season}
              />
              <GoalBlock
                label="Outcome — Career"
                value={p.goals.outcomeCareer ?? p.goals.career}
              />
              <GoalBlock label="Strengths" value={p.goals.strengths} />
              <GoalBlock label="Working On" value={p.goals.workingOn} />
            </div>
          </Section>
        )}

        {/* ---------- Match Log ---------- */}
        {sections.matches && matchesSorted.length > 0 && (
          <Section icon={<Swords size={14} />} title="Match Log">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-300 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-1.5 pr-2">Date</th>
                  <th className="py-1.5 pr-2">Opponent</th>
                  <th className="py-1.5 pr-2">Event</th>
                  <th className="py-1.5 pr-2">Result</th>
                  <th className="py-1.5">Score</th>
                </tr>
              </thead>
              <tbody>
                {matchesSorted.slice(0, 40).map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 avoid-break">
                    <td className="py-1.5 pr-2 tabular-nums text-slate-600">
                      {new Date(m.date + "T00:00:00").toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        }
                      )}
                    </td>
                    <td className="py-1.5 pr-2 font-semibold">
                      {m.opponent ?? "—"}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-600">
                      {m.event ?? ""}
                    </td>
                    <td className="py-1.5 pr-2">
                      {m.result === "win" && (
                        <span className="font-bold text-green-700">W</span>
                      )}
                      {m.result === "loss" && (
                        <span className="font-bold text-red-600">L</span>
                      )}
                      {m.result === "tie" && (
                        <span className="font-bold text-slate-600">T</span>
                      )}
                      {m.wrestling?.winType && (
                        <span className="text-xs text-slate-500 ml-1">
                          ({WRESTLING_WIN_TYPE_LABELS[m.wrestling.winType]})
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 tabular-nums text-slate-700">
                      {m.wrestling?.myScore != null &&
                      m.wrestling?.theirScore != null ? (
                        <>
                          {m.wrestling.myScore}-{m.wrestling.theirScore}
                        </>
                      ) : m.volleyball?.setScores ? (
                        m.volleyball.setScores
                          .map((s) => `${s.us}-${s.them}`)
                          .join(", ")
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {matchesSorted.length > 40 && (
              <p className="text-[11px] text-slate-500 italic mt-2">
                Showing most recent 40 of {matchesSorted.length} matches.
              </p>
            )}
          </Section>
        )}

        {/* ---------- Training Consistency ---------- */}
        {sections.practices && (
          <Section icon={<Calendar size={14} />} title="Training Consistency">
            <div className="grid grid-cols-4 gap-3 text-sm">
              <Stat label="Practices Logged" value={`${totalPractices}`} />
              <Stat label="Habits Completed" value={`${totalHabits}`} />
              <Stat label="Mental Check-Ins" value={`${totalCheckins}`} />
              <Stat label="Current Streak" value={`${streak} days`} />
            </div>
          </Section>
        )}

        {/* ---------- Badges ---------- */}
        {sections.badges && unlockedBadges.length > 0 && (
          <Section icon={<AwardIcon size={14} />} title="Badges Earned">
            <p className="text-xs text-slate-500 mb-2">
              {unlockedBadges.length} of {BADGES.length} unlocked
            </p>
            <div className="grid grid-cols-3 gap-2">
              {unlockedBadges.map(({ def }) =>
                def ? (
                  <div
                    key={def.id}
                    className="border border-slate-200 rounded p-2 flex items-start gap-2 avoid-break"
                  >
                    <span className="text-xl flex-shrink-0">{def.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 leading-tight">
                        {def.name}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {def.description}
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-200">
          Generated by Fearless · {generatedDate}
        </div>
      </div>
    </>
  );
}

// Extra print-scoped style overrides specific to this page
function PrintStyles() {
  return (
    <style>{`
      @media print {
        .print-root {
          color: #111;
        }
        .print-root h1,
        .print-root h2,
        .print-root h3 {
          color: #111 !important;
        }
        .print-root table {
          page-break-inside: auto;
        }
        .print-root tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `}</style>
  );
}

// -----------------------------------------------------------------------------
// Layout helpers
// -----------------------------------------------------------------------------
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 avoid-break">
      <div className="flex items-center gap-2 mb-2.5 border-b border-slate-200 pb-1.5">
        <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-sm uppercase tracking-[0.15em] font-extrabold text-slate-700">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded p-2.5">
      <div className={`text-xl font-extrabold tabular-nums ${accent ?? "text-slate-900"} flex items-center gap-1`}>
        {icon}
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-0.5">
        {label}
      </div>
      {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex">
      <div className="text-slate-500 w-32 flex-shrink-0">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function GoalBlock({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="border border-slate-200 rounded p-2.5 avoid-break">
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
        {label}
      </div>
      <div className="text-sm text-slate-800 mt-0.5 leading-snug whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}

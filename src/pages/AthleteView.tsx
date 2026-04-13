import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  fetchAthleteProfile,
  rowToProfile,
  type DbAthleteRow,
} from "../lib/athleteSync";
import { fetchMatchesForAthlete, rowToMatch } from "../lib/matchSync";
import { computeLevel } from "../lib/gamification";
import {
  VOLLEYBALL_POSITION_LABELS,
  WRESTLING_STYLE_LABELS,
  formatHeight,
} from "../lib/profileOptions";
import {
  WRESTLING_WIN_TYPE_LABELS,
  type MatchEntry,
  type VolleyballPosition,
  type WrestlingStyle,
} from "../types";
import {
  ArrowLeft,
  User,
  Dumbbell,
  BarChart3,
  Target,
  Trophy,
  Zap,
  Flame,
  MapPin,
  Shield,
} from "lucide-react";

/**
 * Coach / Parent view of a connected athlete. Read-only for now.
 * Data comes from the `athletes` Supabase table, which the athlete
 * keeps in sync via upsertAthleteProfile.
 */
export default function AthleteViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<DbAthleteRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [athleteRow, matchRows] = await Promise.all([
          fetchAthleteProfile(id),
          fetchMatchesForAthlete(id),
        ]);
        if (!athleteRow) {
          setError(
            "Couldn't find this athlete's profile. They may not have finished setup yet."
          );
          setLoading(false);
          return;
        }
        setRow(athleteRow);
        setMatches(matchRows.map(rowToMatch));
        // Also fetch the account email for display
        if (supabase) {
          const { data: acct } = await supabase
            .from("accounts")
            .select("email")
            .eq("id", id)
            .maybeSingle();
          setEmail(acct?.email ?? null);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-10 text-center text-slate-400 text-sm">
        Loading athlete...
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </header>
        <div className="card text-sm text-slate-600">
          {error ?? "Athlete not found."}
        </div>
        <p className="text-xs text-slate-500 px-1 leading-relaxed">
          Your athlete might be on an older version of the app, or they
          haven&apos;t signed in since the sync feature was added. Ask them to
          open the app once so their profile uploads — you&apos;ll see their
          data here right after.
        </p>
      </div>
    );
  }

  const profile = rowToProfile(row);
  const info = computeLevel(row.xp, row.sport);
  const initial = (profile.name[0] ?? "?").toUpperCase();

  const metaParts = [
    profile.grade === "K" ? "Kindergarten" : `Grade ${profile.grade}`,
    `Age ${profile.age}`,
  ];
  if (profile.teamName) metaParts.push(profile.teamName);

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Roster
        </Link>
      </header>

      {/* Identity hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-5 shadow-elevated">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-extrabold flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-extrabold tracking-tight">
              {profile.name} {profile.lastName ?? ""}
            </div>
            <div className="text-sm text-white/80 mt-0.5 capitalize">
              {profile.sport} · {metaParts.join(" · ")}
            </div>
            {profile.coachName && (
              <div className="text-xs text-white/60 mt-0.5 flex items-center gap-1">
                <Shield size={11} /> Coach {profile.coachName}
              </div>
            )}
            {profile.hometown && (
              <div className="text-xs text-white/60 mt-0.5 flex items-center gap-1">
                <MapPin size={11} /> {profile.hometown}
              </div>
            )}
            {email && (
              <div className="text-[11px] text-white/50 mt-1">{email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Level / XP card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              Level {info.level}
            </div>
            <div className="font-extrabold text-slate-900 mt-0.5">
              {info.title}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold tabular-nums text-brand-700">
              {row.xp}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              XP
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
            style={{ width: `${info.progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-slate-500 font-semibold">
          <span>Progress to level {info.level + 1}</span>
          <span>{info.progressPct}%</span>
        </div>
      </div>

      {/* About */}
      {(profile.heightInches ||
        profile.weightLbs ||
        profile.yearsPlaying ||
        profile.jerseyNumber) && (
        <Section icon={<User size={14} />} title="About">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row label="Height" value={formatHeight(profile.heightInches)} />
            <Row
              label="Weight"
              value={profile.weightLbs ? `${profile.weightLbs} lbs` : ""}
            />
            <Row
              label="Years Playing"
              value={
                profile.yearsPlaying != null
                  ? `${profile.yearsPlaying}`
                  : ""
              }
            />
            <Row label="Jersey #" value={profile.jerseyNumber} />
          </div>
        </Section>
      )}

      {/* Sport details */}
      <Section
        icon={<Dumbbell size={14} />}
        title={
          profile.sport === "wrestling"
            ? "Wrestling Details"
            : "Volleyball Details"
        }
      >
        {profile.sport === "wrestling" ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row
              label="Weight Class"
              value={
                profile.weightClass ? `${profile.weightClass} lbs` : ""
              }
            />
            <Row
              label="Styles"
              value={
                profile.wrestlingStyles
                  ?.map(
                    (s) => WRESTLING_STYLE_LABELS[s as WrestlingStyle]
                  )
                  .join(", ") ?? ""
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row
              label="Primary"
              value={
                profile.primaryPosition
                  ? VOLLEYBALL_POSITION_LABELS[
                      profile.primaryPosition as VolleyballPosition
                    ]
                  : ""
              }
            />
            <Row
              label="Secondary"
              value={
                profile.secondaryPosition
                  ? VOLLEYBALL_POSITION_LABELS[
                      profile.secondaryPosition as VolleyballPosition
                    ]
                  : ""
              }
            />
            <Row label="Dominant Hand" value={profile.dominantHand} />
            <Row
              label="Vertical"
              value={
                profile.verticalJumpInches
                  ? `${profile.verticalJumpInches}"`
                  : ""
              }
            />
            <Row
              label="Approach"
              value={
                profile.approachJumpInches
                  ? `${profile.approachJumpInches}"`
                  : ""
              }
            />
          </div>
        )}
      </Section>

      {/* Season stats */}
      {profile.sport === "wrestling" && profile.wrestlingStats ? (
        <Section icon={<BarChart3 size={14} />} title="Season Stats">
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              label="Wins"
              value={`${profile.wrestlingStats.wins ?? 0}`}
              accent="text-green-600"
            />
            <StatTile
              label="Losses"
              value={`${profile.wrestlingStats.losses ?? 0}`}
              accent="text-red-500"
            />
            <StatTile
              label="Pins"
              value={`${profile.wrestlingStats.pins ?? 0}`}
              accent="text-amber-600"
            />
          </div>
          {profile.wrestlingStats.season && (
            <div className="text-[11px] text-slate-500 mt-2">
              Season: {profile.wrestlingStats.season}
            </div>
          )}
        </Section>
      ) : profile.sport === "volleyball" && profile.volleyballStats ? (
        <Section icon={<BarChart3 size={14} />} title="Season Stats">
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              label="Kills"
              value={`${profile.volleyballStats.kills ?? 0}`}
            />
            <StatTile
              label="Digs"
              value={`${profile.volleyballStats.digs ?? 0}`}
            />
            <StatTile
              label="Assists"
              value={`${profile.volleyballStats.assists ?? 0}`}
            />
            <StatTile
              label="Blocks"
              value={`${profile.volleyballStats.blocks ?? 0}`}
            />
            <StatTile
              label="Aces"
              value={`${profile.volleyballStats.aces ?? 0}`}
            />
            <StatTile
              label="Matches"
              value={`${profile.volleyballStats.matchesPlayed ?? 0}`}
            />
          </div>
        </Section>
      ) : null}

      {/* Goals */}
      {profile.goals &&
        (profile.goals.processWeek ||
          profile.goals.processSeason ||
          profile.goals.outcomeSeason ||
          profile.goals.outcomeCareer ||
          profile.goals.strengths ||
          profile.goals.workingOn ||
          profile.goals.shortTerm ||
          profile.goals.season ||
          profile.goals.career) && (
          <Section icon={<Target size={14} />} title="Goals & Reflection">
            <div className="space-y-3">
              <GoalItem
                label="This Week"
                value={profile.goals.processWeek ?? profile.goals.shortTerm}
              />
              <GoalItem
                label="This Season (Process)"
                value={profile.goals.processSeason}
              />
              <GoalItem
                label="This Season (Outcome)"
                value={profile.goals.outcomeSeason ?? profile.goals.season}
              />
              <GoalItem
                label="Career"
                value={profile.goals.outcomeCareer ?? profile.goals.career}
              />
              <GoalItem label="Strengths" value={profile.goals.strengths} />
              <GoalItem
                label="Working On"
                value={profile.goals.workingOn}
              />
            </div>
          </Section>
        )}

      {/* Match Log — Phase 2B.4 */}
      {matches.length > 0 ? (
        <Section icon={<Trophy size={14} />} title={`Match Log (${matches.length})`}>
          {/* Quick summary */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <StatTile
              label="W"
              value={`${matches.filter((m) => m.result === "win").length}`}
              accent="text-green-600"
            />
            <StatTile
              label="L"
              value={`${matches.filter((m) => m.result === "loss").length}`}
              accent="text-red-500"
            />
            <StatTile
              label="T"
              value={`${matches.filter((m) => m.result === "tie").length}`}
            />
            <StatTile
              label="Pins"
              value={`${matches.filter((m) => m.result === "win" && m.wrestling?.winType === "pin").length}`}
              accent="text-amber-600"
            />
          </div>

          <div className="space-y-2">
            {matches.slice(0, 15).map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
          {matches.length > 15 && (
            <p className="text-[11px] text-slate-500 italic mt-2 text-center">
              Showing 15 of {matches.length} matches.
            </p>
          )}
        </Section>
      ) : (
        <div className="card bg-slate-50 border-slate-200 text-sm text-slate-600 text-center py-6">
          <Trophy size={24} className="mx-auto text-slate-300 mb-2" />
          No matches logged yet.
        </div>
      )}

      <div className="card bg-slate-50 border-slate-200 text-xs text-slate-500 leading-relaxed">
        <div className="flex items-center gap-1.5 mb-1 font-bold text-slate-600">
          <Zap size={12} /> <Flame size={12} />
          Coming next
        </div>
        Habit streak, practice history, recovery trends, and the ability to
        leave coach feedback on videos and matches.
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Match row for the match log section
// -----------------------------------------------------------------------------
function MatchRow({ match }: { match: MatchEntry }) {
  const prepared = !!match.preMatchCompletedAt;
  const reflected = !!match.postMatchCompletedAt;
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {match.result === "win" && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                W
              </span>
            )}
            {match.result === "loss" && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                L
              </span>
            )}
            {match.result === "tie" && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                T
              </span>
            )}
            {!match.result && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                Upcoming
              </span>
            )}
            <span className="font-bold text-sm text-slate-900 truncate">
              {match.opponent ?? "Opponent"}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {new Date(match.date + "T00:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {match.event ? ` · ${match.event}` : ""}
          </div>
          {match.wrestling?.myScore != null &&
            match.wrestling?.theirScore != null && (
              <div className="text-xs text-slate-700 mt-1 tabular-nums">
                Score: {match.wrestling.myScore}-{match.wrestling.theirScore}
                {match.wrestling.winType && (
                  <span className="text-slate-500">
                    {" "}
                    · {WRESTLING_WIN_TYPE_LABELS[match.wrestling.winType]}
                  </span>
                )}
              </div>
            )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0 items-end">
          {prepared && (
            <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Prep ✓
            </span>
          )}
          {reflected && (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Review ✓
            </span>
          )}
        </div>
      </div>

      {/* Mini reflection: Well / Better / Next when present */}
      {(match.wentWell || match.couldBeBetter || match.nextFocus) && (
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-xs">
          {match.wentWell && (
            <div>
              <span className="font-bold text-emerald-700">✓ Well: </span>
              <span className="text-slate-700">{match.wentWell}</span>
            </div>
          )}
          {match.couldBeBetter && (
            <div>
              <span className="font-bold text-amber-700">🔧 Better: </span>
              <span className="text-slate-700">{match.couldBeBetter}</span>
            </div>
          )}
          {match.nextFocus && (
            <div>
              <span className="font-bold text-brand-700">➡️ Next: </span>
              <span className="text-slate-700">{match.nextFocus}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Helpers
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
    <section className="card">
      <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-3 text-sm">
        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
        {label}
      </div>
      <div className="font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-center">
      <div
        className={`text-xl font-extrabold tabular-nums ${
          accent ?? "text-slate-900"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function GoalItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
        {label}
      </div>
      <div className="text-sm text-slate-800 mt-0.5 whitespace-pre-wrap leading-relaxed">
        {value}
      </div>
    </div>
  );
}

// Silence unused-import warnings for icons we'll use in follow-up updates
void Trophy;

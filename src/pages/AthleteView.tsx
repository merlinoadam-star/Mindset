import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  fetchAthleteProfile,
  rowToProfile,
  type DbAthleteRow,
} from "../lib/athleteSync";
import { fetchMatchesForAthlete, rowToMatch } from "../lib/matchSync";
import { fetchAllAthleteData } from "../lib/dataSync";
import { fetchPersonalRecordsForAthlete } from "../lib/personalRecordsSync";
import {
  formatRecordValue,
  summarizeRecords,
} from "../lib/personalRecords";
import {
  fetchVideosForAthlete,
  getVideoSignedUrl,
  type DbVideoRow,
} from "../lib/videoSync";
import FeedbackThread from "../components/FeedbackThread";
import CoachWeeklyFocusCard from "../components/CoachWeeklyFocusCard";
import PushPlanModal from "../components/PushPlanModal";
import { useAuth } from "../lib/authContext";
import CheerButtons from "../components/CheerButtons";
import PrivateChatsSection from "../components/PrivateChatsSection";
import AthleteGlanceCard from "../components/AthleteGlanceCard";
import WeeklyWrapUpCard from "../components/WeeklyWrapUpCard";
import CoachVideoUpload from "../components/CoachVideoUpload";
import { useRealtime } from "../lib/useRealtime";
import { BADGES, getBadge } from "../lib/gamification";
import { computeLevel } from "../lib/gamification";
import { habitsForSport } from "../lib/habits";
import {
  fetchCustomHabits,
  rowToHabit,
  type CustomHabitRow,
} from "../lib/customHabitsSync";
import {
  VOLLEYBALL_POSITION_LABELS,
  WRESTLING_STYLE_LABELS,
  formatHeight,
} from "../lib/profileOptions";
import {
  WRESTLING_WIN_TYPE_LABELS,
  type MatchEntry,
  type PersonalRecordAttempt,
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
  ClipboardList,
} from "lucide-react";

/**
 * Coach / Parent view of a connected athlete. Read-only for now.
 * Data comes from the `athletes` Supabase table, which the athlete
 * keeps in sync via upsertAthleteProfile.
 */
export default function AthleteViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { account } = useAuth();
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [customHabits, setCustomHabits] = useState<CustomHabitRow[]>([]);
  const [row, setRow] = useState<DbAthleteRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [extra, setExtra] = useState<any | null>(null);
  const [videos, setVideos] = useState<DbVideoRow[]>([]);
  const [records, setRecords] = useState<PersonalRecordAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tracks the most recently issued fetch so stale completions can't clobber
  // newer state (e.g., id changed mid-fetch, or a realtime refresh raced the
  // initial load).
  const requestSeq = useRef(0);

  const loadAll = useCallback(
    async (showSpinner: boolean) => {
      if (!id) return;
      const seq = ++requestSeq.current;
      const fetchedId = id;
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const [athleteRow, matchRows, all, videoRows, recordRows] =
          await Promise.all([
            fetchAthleteProfile(id),
            fetchMatchesForAthlete(id),
            fetchAllAthleteData(id),
            fetchVideosForAthlete(id),
            fetchPersonalRecordsForAthlete(id),
          ]);
        if (seq !== requestSeq.current) return;
        if (!athleteRow) {
          setError(
            "Couldn't find this athlete's profile. They may not have finished setup yet."
          );
          if (showSpinner) setLoading(false);
          return;
        }
        setRow(athleteRow);
        setMatches(matchRows.map(rowToMatch));
        setExtra(all);
        setVideos(videoRows);
        setRecords(recordRows);
        // Also fetch the account email for display
        if (supabase && showSpinner) {
          const { data: acct } = await supabase
            .from("accounts")
            .select("email")
            .eq("id", fetchedId)
            .maybeSingle();
          if (seq !== requestSeq.current) return;
          setEmail(acct?.email ?? null);
        }
      } catch (e) {
        if (seq !== requestSeq.current) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (seq === requestSeq.current && showSpinner) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadAll(true);
  }, [loadAll]);

  // Custom habits are stored separately from the bulk athlete data fetch.
  // Pull them in parallel so the Habits section below shows everything.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const rows = await fetchCustomHabits(id);
      if (!cancelled) setCustomHabits(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Scroll to the URL #hash once the page has finished loading. Used by
  // deep links (e.g. parent's daily-review "View" buttons → #recent-checkins).
  useEffect(() => {
    if (loading || !location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      // requestAnimationFrame so the layout has settled after the loading
      // skeleton is replaced by the real content.
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [loading, location.hash]);

  // Realtime — any change to the athlete's data refreshes the view.
  // One subscription per athlete-scoped table. All fire the same silent
  // refetch (no spinner) so the coach sees updates appear smoothly.
  const silentRefresh = useCallback(() => loadAll(false), [loadAll]);
  const athleteFilter = id ? `athlete_id=eq.${id}` : undefined;
  const idFilter = id ? `id=eq.${id}` : undefined;
  useRealtime({ table: "athletes", filter: idFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "matches", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "practices", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "habit_completions", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "mental_checkins", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "recovery_checkins", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "nutrition_logs", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "weekly_reviews", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "tournaments", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "awards", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "unlocked_badges", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "videos", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "weekly_focus", filter: athleteFilter, enabled: !!id }, silentRefresh);
  useRealtime({ table: "personal_records", filter: athleteFilter, enabled: !!id }, silentRefresh);

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

      {/* Weekly focus (editable by connected coach / parent) */}
      {id && <CoachWeeklyFocusCard athleteId={id} />}

      {/* Coach-only: push a daily practice plan */}
      {id && account?.role === "coach" && (
        <button
          onClick={() => setPlanModalOpen(true)}
          className="w-full card-interactive flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <ClipboardList size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Push today's practice plan
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Build a checklist — athlete earns XP as they complete it.
            </div>
          </div>
        </button>
      )}

      {id && profile && (
        <PushPlanModal
          open={planModalOpen}
          onClose={() => setPlanModalOpen(false)}
          athleteAccountId={id}
          athleteName={profile.name}
        />
      )}

      {/* One-tap encouragement */}
      {id && <CheerButtons athleteId={id} />}

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
        <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
            style={{ width: `${info.progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span>Progress to level {info.level + 1}</span>
          <span>{info.progressPct}%</span>
        </div>
      </div>

      {/* AI-generated weekly wrap-up (Phase 4F.1) */}
      {id && <WeeklyWrapUpCard athleteId={id} />}

      {/* At-a-glance analytics (Phase 4D.2) */}
      <AthleteGlanceCard
        profileRow={row}
        matches={matches}
        extra={extra}
      />

      {/* Private coach↔parent chats — hidden from athletes via RLS and
          a role guard on the page itself. */}
      {id && (
        <PrivateChatsSection athleteId={id} athleteName={profile.name} />
      )}

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

      {/* Training consistency — Phase 2B.5 */}
      {extra && (
        <Section
          id="practice-log"
          icon={<Flame size={14} />}
          title="Practice Log"
        >
          <div className="grid grid-cols-4 gap-2">
            <StatTile
              label="Practices"
              value={`${extra.practices.length}`}
              accent="text-brand-700"
            />
            <StatTile
              label="Habits"
              value={`${extra.habits.length}`}
              accent="text-emerald-700"
            />
            <StatTile
              label="Check-Ins"
              value={`${extra.mentalCheckins.length}`}
              accent="text-purple-700"
            />
            <StatTile
              label="Recovery"
              value={`${extra.recovery.length}`}
              accent="text-sky-700"
            />
          </div>
          {extra.practices.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Recent Practices
              </div>
              <div className="space-y-1">
                {extra.practices
                  .slice(0, 5)
                  .map(
                    (p: {
                      id: string;
                      date: string;
                      type: string;
                      duration_min: number;
                      intensity: number;
                    }) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                      >
                        <span className="text-slate-500 w-20 flex-shrink-0 tabular-nums">
                          {new Date(p.date + "T00:00:00").toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                        <span className="flex-1 font-semibold text-slate-800 truncate">
                          {p.type}
                        </span>
                        <span className="text-slate-500 tabular-nums">
                          {p.duration_min}m · {p.intensity}/5
                        </span>
                      </div>
                    )
                  )}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Habits — today's checkmarks. Anchored so the parent's Daily
          Review "View" link can deep-link here. */}
      {extra && profile && (
        <Section id="habits" icon={<Target size={14} />} title="Habits">
          {(() => {
            const today = new Date().toISOString().slice(0, 10);
            const todayCompletions = (
              extra.habits as Array<{ habit_id: string; date: string }>
            ).filter((h) => h.date === today);
            const presetHabits = habitsForSport(profile.sport);
            const customDefs = customHabits.map(rowToHabit);
            const allHabits = [...presetHabits, ...customDefs];
            const completedIds = new Set(todayCompletions.map((h) => h.habit_id));

            return (
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
                  Today · {todayCompletions.length} of {allHabits.length}
                </div>
                <div className="space-y-1.5">
                  {allHabits.map((h) => {
                    const done = completedIds.has(h.id);
                    return (
                      <div
                        key={h.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                            done
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                          aria-hidden="true"
                        >
                          {done ? "✓" : ""}
                        </div>
                        <span
                          className={
                            done
                              ? "text-slate-500 dark:text-slate-400 line-through"
                              : "text-slate-800 dark:text-slate-100"
                          }
                        >
                          {h.emoji} {h.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {extra.habits.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    All-time: {extra.habits.length} habit completions logged.
                  </div>
                )}
              </div>
            );
          })()}
        </Section>
      )}

      {/* Recent Mental Check-Ins */}
      {extra?.mentalCheckins && extra.mentalCheckins.length > 0 && (
        <Section
          id="mental-checkin"
          icon={<Target size={14} />}
          title="Mental Check-In"
        >
          <div className="space-y-2">
            {extra.mentalCheckins
              .slice(0, 5)
              .map(
                (c: {
                  id: string;
                  date: string;
                  mood: number;
                  goal: string | null;
                  goal_met: boolean | null;
                  gratitude: string | null;
                }) => {
                  const emoji = ["😩", "😕", "😐", "🙂", "🔥"][c.mood - 1] ?? "😐";
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{emoji}</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {new Date(c.date + "T00:00:00").toLocaleDateString(
                            undefined,
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      {c.goal && (
                        <div className="mt-1 text-xs">
                          <span className="text-slate-500">🎯 </span>
                          <span
                            className={
                              c.goal_met === false
                                ? "line-through text-slate-400"
                                : "text-slate-800"
                            }
                          >
                            {c.goal}
                          </span>
                          {c.goal_met === true && (
                            <span className="ml-1 text-[10px] font-bold text-emerald-700">
                              ✓ hit
                            </span>
                          )}
                          {c.goal_met === false && (
                            <span className="ml-1 text-[10px] font-bold text-slate-500">
                              missed
                            </span>
                          )}
                        </div>
                      )}
                      {c.gratitude && (
                        <div className="text-xs text-slate-600 mt-0.5">
                          <span className="text-slate-400">🙏 </span>
                          {c.gratitude}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
          </div>
        </Section>
      )}

      {/* Recent Recovery */}
      {extra?.recovery && extra.recovery.length > 0 && (
        <Section icon={<Zap size={14} />} title="Recent Recovery">
          <div className="space-y-1">
            {extra.recovery
              .slice(0, 5)
              .map(
                (r: {
                  id: string;
                  date: string;
                  sleep_hours: number | null;
                  sleep_quality: number | null;
                  soreness: number | null;
                  energy: number | null;
                }) => {
                  const parts: string[] = [];
                  if (r.sleep_hours) parts.push(`${r.sleep_hours}h sleep`);
                  if (r.energy) parts.push(`energy ${r.energy}/5`);
                  if (r.soreness) parts.push(`soreness ${r.soreness}/5`);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                    >
                      <span className="text-slate-600 font-semibold">
                        {new Date(r.date + "T00:00:00").toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                      <span className="text-slate-700">
                        {parts.join(" · ")}
                      </span>
                    </div>
                  );
                }
              )}
          </div>
        </Section>
      )}

      {/* Latest Weekly Review */}
      {extra?.weeklyReviews && extra.weeklyReviews.length > 0 && (
        <Section icon={<Flame size={14} />} title="Latest Weekly Review">
          {(() => {
            const w = extra.weeklyReviews[0] as {
              week_start_date: string;
              wins: string[];
              challenge: string | null;
              learned: string | null;
              next_week_goal: string | null;
            };
            return (
              <div className="space-y-2 text-sm">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Week of{" "}
                  {new Date(w.week_start_date + "T00:00:00").toLocaleDateString(
                    undefined,
                    { month: "long", day: "numeric" }
                  )}
                </div>
                {w.wins && w.wins.filter(Boolean).length > 0 && (
                  <div>
                    <div className="text-amber-700 font-bold text-xs">
                      🏆 Wins
                    </div>
                    <ul className="text-slate-700 mt-0.5 list-disc list-inside">
                      {w.wins.filter(Boolean).map((win, i) => (
                        <li key={i}>{win}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {w.challenge && (
                  <div>
                    <div className="text-red-600 font-bold text-xs">
                      ⚠️ Challenge
                    </div>
                    <div className="text-slate-700">{w.challenge}</div>
                  </div>
                )}
                {w.learned && (
                  <div>
                    <div className="text-amber-600 font-bold text-xs">
                      💡 Lesson
                    </div>
                    <div className="text-slate-700">{w.learned}</div>
                  </div>
                )}
                {w.next_week_goal && (
                  <div>
                    <div className="text-brand-700 font-bold text-xs">
                      🎯 Next Goal
                    </div>
                    <div className="text-slate-700">{w.next_week_goal}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </Section>
      )}

      {/* Tournaments */}
      {extra?.tournaments && extra.tournaments.length > 0 && (
        <Section icon={<Trophy size={14} />} title="Tournaments & Events">
          <ul className="space-y-1 text-sm">
            {extra.tournaments
              .slice(0, 10)
              .map(
                (t: {
                  id: string;
                  name: string;
                  year: number;
                  result: string;
                  type: string | null;
                }) => (
                  <li
                    key={t.id}
                    className="flex items-start gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                  >
                    <span>🏆</span>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900">
                        {t.name}
                      </span>
                      <span className="text-slate-500"> · {t.year}</span>
                      {t.result && (
                        <span className="font-semibold text-slate-700">
                          {" "}
                          — {t.result}
                        </span>
                      )}
                    </div>
                  </li>
                )
              )}
          </ul>
        </Section>
      )}

      {/* Awards */}
      {extra?.awards && extra.awards.length > 0 && (
        <Section icon={<Trophy size={14} />} title="Awards & Accolades">
          <ul className="space-y-1 text-sm">
            {extra.awards.map(
              (a: {
                id: string;
                name: string;
                year: number;
                note: string | null;
              }) => (
                <li
                  key={a.id}
                  className="flex items-start gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                >
                  <span>🎖️</span>
                  <div className="flex-1">
                    <span className="font-semibold text-slate-900">
                      {a.name}
                    </span>
                    <span className="text-slate-500"> · {a.year}</span>
                    {a.note && (
                      <span className="text-slate-500 italic">
                        {" "}
                        — {a.note}
                      </span>
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        </Section>
      )}

      {/* Badges */}
      {extra?.badges && extra.badges.length > 0 && (
        <Section icon={<Zap size={14} />} title={`Badges (${extra.badges.length}/${BADGES.length})`}>
          <div className="grid grid-cols-4 gap-2">
            {extra.badges
              .slice(0, 12)
              .map((b: { id: string }) => {
                const def = getBadge(b.id);
                if (!def) return null;
                return (
                  <div
                    key={b.id}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-center"
                    title={def.description}
                  >
                    <div className="text-2xl">{def.emoji}</div>
                    <div className="text-[9px] font-bold text-slate-700 dark:text-slate-200 mt-0.5 leading-tight">
                      {def.name}
                    </div>
                  </div>
                );
              })}
          </div>
        </Section>
      )}

      {/* Coach video upload */}
      {id && <CoachVideoUpload athleteId={id} athleteName={profile.name} />}

      {/* Videos — Phase 2B.6 */}
      {videos.length > 0 && (
        <Section icon={<Trophy size={14} />} title={`Videos (${videos.length})`}>
          <div className="grid grid-cols-2 gap-2">
            {videos.slice(0, 8).map((v) => (
              <VideoThumb key={v.id} video={v} athleteId={id!} />
            ))}
          </div>
          {videos.length > 8 && (
            <p className="text-[11px] text-slate-500 italic mt-2 text-center">
              Showing 8 of {videos.length} videos.
            </p>
          )}
        </Section>
      )}

      {/* Personal Records */}
      {records.length > 0 && row && (
        <Section
          icon={<Trophy size={14} />}
          title={`Personal Records (${new Set(records.map((r) => r.categoryKey)).size})`}
        >
          <div className="space-y-2">
            {summarizeRecords(records, row.sport).slice(0, 8).map((s) => (
              <div
                key={s.categoryKey}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-xl leading-none">{s.emoji ?? "⭐"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {s.totalAttempts} attempt{s.totalAttempts === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatRecordValue(s.best.value, s.unit)}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(s.best.achievedOn + "T00:00:00").toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Match Log — Phase 2B.4 */}
      {matches.length > 0 ? (
        <Section
          id="match-log"
          icon={<Trophy size={14} />}
          title={`Match Log (${matches.length})`}
        >
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
              <MatchRow key={m.id} match={m} athleteId={id!} />
            ))}
          </div>
          {matches.length > 15 && (
            <p className="text-[11px] text-slate-500 italic mt-2 text-center">
              Showing 15 of {matches.length} matches.
            </p>
          )}
        </Section>
      ) : (
        <Section id="match-log" icon={<Trophy size={14} />} title="Match Log">
          <div className="text-sm text-slate-600 dark:text-slate-300 text-center py-4">
            <Trophy
              size={24}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
            />
            No matches logged yet.
          </div>
        </Section>
      )}

      <div className="card bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        <div className="flex items-center gap-1.5 mb-1 font-bold text-slate-600 dark:text-slate-300">
          <Zap size={12} /> <Flame size={12} />
          Coming next
        </div>
        Video sharing for coach feedback, real-time updates when the athlete
        logs something, and coach-authored notes on matches and videos.
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Match row for the match log section
// -----------------------------------------------------------------------------
function MatchRow({
  match,
  athleteId,
}: {
  match: MatchEntry;
  athleteId: string;
}) {
  const prepared = !!match.preMatchCompletedAt;
  const reflected = !!match.postMatchCompletedAt;
  const [showFeedback, setShowFeedback] = useState(false);
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
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1 text-xs">
          {match.wentWell && (
            <div>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">✓ Well: </span>
              <span className="text-slate-700 dark:text-slate-200">{match.wentWell}</span>
            </div>
          )}
          {match.couldBeBetter && (
            <div>
              <span className="font-bold text-amber-700 dark:text-amber-300">🔧 Better: </span>
              <span className="text-slate-700 dark:text-slate-200">{match.couldBeBetter}</span>
            </div>
          )}
          {match.nextFocus && (
            <div>
              <span className="font-bold text-brand-700 dark:text-brand-300">➡️ Next: </span>
              <span className="text-slate-700 dark:text-slate-200">{match.nextFocus}</span>
            </div>
          )}
        </div>
      )}

      {/* Loss-recovery — coach-visible read-only summary so the coach
          can respond to the athlete's processing of a tough match. */}
      {match.lossRecoveryCompletedAt && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
          <div className="font-bold text-indigo-700 dark:text-indigo-300 mb-1">
            💜 Worked through this loss
          </div>
          {match.lossRecoveryLesson && (
            <div className="mb-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Lesson:{" "}
              </span>
              <span className="text-slate-700 dark:text-slate-200">
                {match.lossRecoveryLesson}
              </span>
            </div>
          )}
          {match.lossRecoveryCarry && (
            <div>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Taking forward:{" "}
              </span>
              <span className="text-slate-700 dark:text-slate-200">
                {match.lossRecoveryCarry}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Feedback thread toggle */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setShowFeedback((s) => !s)}
          className="text-[11px] font-bold text-brand-600 hover:text-brand-800 uppercase tracking-wider"
        >
          {showFeedback ? "Hide notes" : "💬 Leave / View notes"}
        </button>
        {showFeedback && (
          <div className="mt-2">
            <FeedbackThread
              athleteId={athleteId}
              targetType="match"
              targetId={match.id}
              compact
            />
          </div>
        )}
      </div>
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
  id,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="card scroll-mt-24">
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
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-center">
      <div
        className={`text-xl font-extrabold tabular-nums ${
          accent ?? "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mt-0.5">
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

// -----------------------------------------------------------------------------
// Video thumbnail + in-place playback using a signed URL
// -----------------------------------------------------------------------------
function VideoThumb({
  video,
  athleteId,
}: {
  video: DbVideoRow;
  athleteId: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function startPlayback() {
    if (!video.storage_path) return;
    setPlaying(true);
    if (!signedUrl) {
      setLoadingUrl(true);
      const url = await getVideoSignedUrl(video.storage_path);
      setSignedUrl(url);
      setLoadingUrl(false);
    }
  }

  function seekTo(seconds: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, seconds);
    el.play().catch(() => {});
  }

  if (playing) {
    return (
      <div className="col-span-2 rounded-2xl overflow-hidden bg-black">
        <div className="aspect-video relative">
          {loadingUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
              Loading...
            </div>
          )}
          {signedUrl && (
            <video
              ref={videoRef}
              src={signedUrl}
              controls
              autoPlay
              playsInline
              onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
              className="w-full h-full"
            />
          )}
        </div>
        <div className="p-3">
          <div className="font-bold text-white text-sm">{video.title}</div>
          {video.description && (
            <div className="text-xs text-white/70 mt-1">
              {video.description}
            </div>
          )}
          {video.self_notes && (
            <div className="text-xs text-white/60 italic mt-1">
              &ldquo;{video.self_notes}&rdquo;
            </div>
          )}
          <button
            onClick={() => setPlaying(false)}
            className="mt-2 text-xs text-white/60 font-semibold"
          >
            Close
          </button>
        </div>
        {/* Feedback thread under the expanded video — with timestamp pinning */}
        <div className="p-3 pt-0">
          <FeedbackThread
            athleteId={athleteId}
            targetType="video"
            targetId={video.id}
            compact
            videoCurrentTime={currentTime}
            onSeekTo={seekTo}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={startPlayback}
      className="text-left group rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-card hover:shadow-card-hover transition"
    >
      <div className="aspect-video bg-slate-900 relative overflow-hidden">
        {video.thumbnail_data_url ? (
          <img
            src={video.thumbnail_data_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl">
            🎥
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center">
            <span className="ml-0.5 text-slate-900">▶</span>
          </div>
        </div>
        {video.marked_for_review && !video.reviewed_at && (
          <div className="absolute top-1 left-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Review
          </div>
        )}
        {video.reviewed_at && (
          <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            ✓ Done
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="font-bold text-xs text-slate-900 truncate">
          {video.title}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {video.tag}
        </div>
      </div>
    </button>
  );
}

// Silence unused-import warnings for icons we'll use in follow-up updates
void Trophy;

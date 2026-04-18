import { useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/authContext";
import { isUuid } from "../lib/store";
import { showReward } from "./RewardToast";
import FeedbackThread from "./FeedbackThread";
import MatchReflectionPrompts from "./MatchReflectionPrompts";
import ShareWinModal from "./ShareWinModal";
import LossRecoveryModal, { LossRecoverySummary } from "./LossRecoveryModal";
import { Heart } from "lucide-react";
import type { ShareWinData } from "../lib/shareWins";
import { Share2 } from "lucide-react";
import {
  WRESTLING_WIN_TYPE_LABELS,
  type MatchEntry,
  type MatchResult,
  type Mood,
  type VolleyballMatchDetails,
  type VolleyballPosition,
  type WrestlingMatchDetails,
  type WrestlingWinType,
} from "../types";
import {
  VOLLEYBALL_POSITION_LABELS,
  VOLLEYBALL_POSITION_ORDER,
} from "../lib/profileOptions";
import { ArrowLeft, Brain, Target, Trophy, Sparkles, Trash2, Sword, Swords, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { todayISO } from "../lib/gamification";
import SpeakButton from "./SpeakButton";

interface Props {
  match: MatchEntry;
  onBack: () => void;
}

type Phase = "overview" | "pre" | "post";

export default function MatchDetail({ match, onBack }: Props) {
  const { state, updateMatch, deleteMatch } = useStore();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("overview");
  const [shareData, setShareData] = useState<ShareWinData | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  if (!state.profile) return null;

  const prePrepared = !!match.preMatchCompletedAt;
  const postReflected = !!match.postMatchCompletedAt;
  const isLoss = match.result === "loss";
  const recoveryDone = !!match.lossRecoveryCompletedAt;
  // Only show the recovery CTA after the post-match reflection is in —
  // otherwise we'd be asking them to process feelings before they've
  // even logged the score.
  const showRecoveryCta = isLoss && postReflected && !recoveryDone;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> All Matches
        </button>
        <h1 className="page-title">{match.opponent || "Match"}</h1>
        <p className="page-subtitle">
          {formatLongDate(match.date)}
          {match.event ? ` · ${match.event}` : ""}
          {match.location ? ` · ${match.location}` : ""}
        </p>
      </header>

      {phase === "overview" && (
        <>
          {/* Match Day mode — only for upcoming / today matches that
              haven't been post-reflected yet. */}
          {!postReflected && match.date >= todayISO() && (
            <Link
              to={`/match-day?id=${match.id}`}
              className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-brand-900 to-purple-900 text-white p-4 shadow-elevated group"
            >
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-brand-500/30 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Swords size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">
                    {match.date === todayISO() ? "Today" : "Upcoming"}
                  </div>
                  <div className="text-lg font-extrabold tracking-tight leading-tight">
                    {prePrepared ? "Run Match Day Again" : "Run Match Day Mode"}
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    Focus · visualize · breathe · lock in
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-white/70 flex-shrink-0 group-active:translate-x-0.5 transition"
                />
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPhase("pre")}
              className={`card-interactive text-left ${
                prePrepared ? "border-purple-200 bg-purple-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Brain size={18} />
                </div>
                <span className="font-bold text-slate-900">Pre-Match</span>
              </div>
              <div className="mt-3 text-xs text-slate-600">
                {prePrepared
                  ? "Mental prep complete — tap to view or edit"
                  : "Set your focus, visualize, get ready"}
              </div>
              <div className="mt-2 text-xs font-bold text-purple-700">
                {prePrepared ? "✓ Complete" : "+15 XP"}
              </div>
            </button>

            <button
              onClick={() => setPhase("post")}
              className={`card-interactive text-left ${
                postReflected ? "border-emerald-200 bg-emerald-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Target size={18} />
                </div>
                <span className="font-bold text-slate-900">Post-Match</span>
              </div>
              <div className="mt-3 text-xs text-slate-600">
                {postReflected
                  ? "Reflection complete — tap to view or edit"
                  : "Log result + Well / Better / Next"}
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-700">
                {postReflected ? "✓ Complete" : "+30 XP (bonuses available)"}
              </div>
            </button>
          </div>

          {prePrepared && (
            <section className="card">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-purple-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  Mental Prep
                </h2>
              </div>
              {match.focusObjective && (
                <Field label="Focus" value={match.focusObjective} />
              )}
              {match.executeThis && (
                <Field label="Execute" value={match.executeThis} />
              )}
              {match.visualizationNote && (
                <Field
                  label="Visualization"
                  value={match.visualizationNote}
                />
              )}
              {match.mentalStateBefore && (
                <div className="mt-3 text-xs text-slate-500">
                  Mental state: <MoodChip mood={match.mentalStateBefore} />
                </div>
              )}
            </section>
          )}

          {showRecoveryCta && (
            <button
              onClick={() => setRecoveryOpen(true)}
              className="block w-full text-left rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
                  <Heart size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Tough one — want to work through it?
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                    A 3-step ritual: feel it, name it, carry one thing forward.
                    Takes about a minute.
                  </div>
                  <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-1.5">
                    +20 XP
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-indigo-500 flex-shrink-0 mt-1"
                />
              </div>
            </button>
          )}

          {recoveryDone && <LossRecoverySummary match={match} />}

          {postReflected && (
            <section className="card">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={14} className="text-emerald-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  Reflection
                </h2>
              </div>
              {match.result && (
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  <ResultBadge result={match.result} />
                  <ScoreText match={match} />
                  {match.result === "win" && (
                    <button
                      onClick={() =>
                        setShareData({
                          type: "match",
                          athleteName: state.profile!.name,
                          opponent: match.opponent ?? "opponent",
                          result: "W",
                          myScore: match.wrestling?.myScore,
                          theirScore: match.wrestling?.theirScore,
                          winType: match.wrestling?.winType
                            ? (match.wrestling.winType as string)
                                .replace(/-/g, " ")
                            : undefined,
                        })
                      }
                      className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200"
                    >
                      <Share2 size={12} /> Share win
                    </button>
                  )}
                </div>
              )}
              {match.wentWell && (
                <Field label="✅ Well" value={match.wentWell} />
              )}
              {match.couldBeBetter && (
                <Field label="🔧 Better" value={match.couldBeBetter} />
              )}
              {match.nextFocus && (
                <Field label="➡️ Next" value={match.nextFocus} />
              )}
              {match.gratitude && (
                <Field label="🙏 Gratitude" value={match.gratitude} />
              )}
              {match.lessonLearned && (
                <Field label="💡 Lesson" value={match.lessonLearned} />
              )}
            </section>
          )}

          {/* AI reflection prompts — Phase 4F.2 — only when post-match is done */}
          {user && isUuid(match.id) && match.postMatchCompletedAt && (
            <MatchReflectionPrompts athleteId={user.id} matchId={match.id} />
          )}

          {/* Coach / parent notes — Phase 2C */}
          {user && isUuid(match.id) && (
            <FeedbackThread
              athleteId={user.id}
              targetType="match"
              targetId={match.id}
            />
          )}

          <button
            onClick={() => {
              if (confirm("Delete this match? This cannot be undone.")) {
                deleteMatch(match.id);
                onBack();
              }
            }}
            className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 mx-auto pt-2"
          >
            <Trash2 size={12} /> Delete match
          </button>
        </>
      )}

      {phase === "pre" && (
        <PreMatchForm
          match={match}
          onBack={() => setPhase("overview")}
          onSave={(updates) => {
            const { awardedXp, newlyUnlocked } = updateMatch(match.id, {
              ...updates,
              preMatchCompletedAt: new Date().toISOString(),
            });
            if (awardedXp > 0 || newlyUnlocked.length) {
              showReward(awardedXp, newlyUnlocked);
            }
            setPhase("overview");
          }}
        />
      )}

      {phase === "post" && (
        <PostMatchForm
          match={match}
          sport={state.profile.sport}
          onBack={() => setPhase("overview")}
          onSave={(updates) => {
            const { awardedXp, newlyUnlocked } = updateMatch(match.id, {
              ...updates,
              postMatchCompletedAt: new Date().toISOString(),
            });
            if (awardedXp > 0 || newlyUnlocked.length) {
              showReward(awardedXp, newlyUnlocked);
            }
            setPhase("overview");
          }}
        />
      )}

      <ShareWinModal data={shareData} onClose={() => setShareData(null)} />

      {recoveryOpen && (
        <LossRecoveryModal
          match={match}
          onClose={() => setRecoveryOpen(false)}
          onComplete={(answers) => {
            const { awardedXp, newlyUnlocked } = updateMatch(match.id, {
              lossRecoveryFeeling: answers.feeling,
              lossRecoveryLesson: answers.lesson,
              lossRecoveryCarryType: answers.carryType,
              lossRecoveryCarry: answers.carry,
              lossRecoveryCompletedAt: new Date().toISOString(),
            });
            if (awardedXp > 0 || newlyUnlocked.length) {
              showReward(awardedXp, newlyUnlocked);
            }
            setRecoveryOpen(false);
          }}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Pre-match form
// -----------------------------------------------------------------------------
function PreMatchForm({
  match,
  onBack,
  onSave,
}: {
  match: MatchEntry;
  onBack: () => void;
  onSave: (updates: Partial<MatchEntry>) => void;
}) {
  const { state, incrementPhraseUse } = useStore();
  const pinnedPhrase = state.powerPhrases.find((p) => p.isPinned);

  const [focusObjective, setFocus] = useState(match.focusObjective ?? "");
  const [executeThis, setExecute] = useState(match.executeThis ?? "");
  const [mentalState, setMentalState] = useState<Mood | undefined>(
    match.mentalStateBefore
  );
  const [visNote, setVisNote] = useState(match.visualizationNote ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      focusObjective: focusObjective.trim() || undefined,
      executeThis: executeThis.trim() || undefined,
      mentalStateBefore: mentalState,
      visualizationNote: visNote.trim() || undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {pinnedPhrase && (
        <button
          type="button"
          onClick={() => incrementPhraseUse(pinnedPhrase.id)}
          className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 text-white p-4 text-left shadow-elevated"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Sword size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-200 mb-1">
                Your Mantra
              </div>
              <blockquote className="text-sm font-extrabold leading-tight">
                &ldquo;{pinnedPhrase.text}&rdquo;
              </blockquote>
            </div>
            <SpeakButton text={pinnedPhrase.text} size="sm" rate={0.9} />
          </div>
        </button>
      )}

      <div className="card bg-gradient-to-br from-purple-50 to-white border-purple-100">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={16} className="text-purple-600" />
          <h2 className="font-bold text-slate-900">Mental Prep</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          The best competitors enter with a clear focus and a calm mind.
        </p>

        <Label>My focus for this match</Label>
        <textarea
          value={focusObjective}
          onChange={(e) => setFocus(e.target.value)}
          rows={2}
          placeholder="Stay in good position. Don't force shots. Hand fight."
          className={textareaCls}
        />
      </div>

      <div className="card">
        <Label>One thing I want to execute</Label>
        <textarea
          value={executeThis}
          onChange={(e) => setExecute(e.target.value)}
          rows={2}
          placeholder="Set up my single leg with a level change + snap"
          className={textareaCls}
        />
      </div>

      <div className="card">
        <Label>How am I feeling?</Label>
        <div className="grid grid-cols-5 gap-2 mt-1">
          {([1, 2, 3, 4, 5] as Mood[]).map((n) => (
            <button
              type="button"
              key={n}
              onClick={() =>
                setMentalState(mentalState === n ? undefined : n)
              }
              className={`py-2 rounded-xl border-2 text-xl transition ${
                mentalState === n
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200"
              }`}
            >
              {["😩", "😕", "😐", "🙂", "🔥"][n - 1]}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <Label>Visualization notes</Label>
        <p className="text-[11px] text-slate-500 mb-2">
          Close your eyes for 2 minutes. See yourself succeed. Write one vivid
          detail below.
        </p>
        <textarea
          value={visNote}
          onChange={(e) => setVisNote(e.target.value)}
          rows={3}
          placeholder="I see myself getting to my attacks in the first 10 seconds, feeling strong and confident."
          className={textareaCls}
        />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          {match.preMatchCompletedAt ? "Save Changes" : "Lock In Prep +15 XP"}
        </button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Post-match form
// -----------------------------------------------------------------------------
function PostMatchForm({
  match,
  sport,
  onBack,
  onSave,
}: {
  match: MatchEntry;
  sport: "wrestling" | "volleyball";
  onBack: () => void;
  onSave: (updates: Partial<MatchEntry>) => void;
}) {
  const [result, setResult] = useState<MatchResult | undefined>(match.result);
  const [performance, setPerformance] = useState<Mood | undefined>(
    match.performanceRating
  );

  // Wrestling-specific
  const [winType, setWinType] = useState<WrestlingWinType | undefined>(
    match.wrestling?.winType
  );
  const [myScore, setMyScore] = useState(
    match.wrestling?.myScore?.toString() ?? ""
  );
  const [theirScore, setTheirScore] = useState(
    match.wrestling?.theirScore?.toString() ?? ""
  );

  // Volleyball-specific
  const [position, setPosition] = useState<VolleyballPosition | undefined>(
    match.volleyball?.positionPlayed
  );
  const [setScores, setSetScores] = useState<{ us: string; them: string }[]>(
    match.volleyball?.setScores?.map((s) => ({
      us: s.us.toString(),
      them: s.them.toString(),
    })) ?? [{ us: "", them: "" }]
  );
  const [kills, setKills] = useState(match.volleyball?.kills?.toString() ?? "");
  const [digs, setDigs] = useState(match.volleyball?.digs?.toString() ?? "");
  const [assists, setAssists] = useState(
    match.volleyball?.assists?.toString() ?? ""
  );
  const [blocks, setBlocks] = useState(
    match.volleyball?.blocks?.toString() ?? ""
  );
  const [aces, setAces] = useState(match.volleyball?.aces?.toString() ?? "");
  const [errors, setErrors] = useState(
    match.volleyball?.errors?.toString() ?? ""
  );

  // Reflection
  const [wentWell, setWentWell] = useState(match.wentWell ?? "");
  const [couldBeBetter, setBetter] = useState(match.couldBeBetter ?? "");
  const [nextFocus, setNext] = useState(match.nextFocus ?? "");
  const [gratitude, setGratitude] = useState(match.gratitude ?? "");
  const [lessonLearned, setLesson] = useState(match.lessonLearned ?? "");

  function addSet() {
    if (setScores.length < 5) {
      setSetScores([...setScores, { us: "", them: "" }]);
    }
  }

  function removeSet(idx: number) {
    setSetScores(setScores.filter((_, i) => i !== idx));
  }

  function parseN(s: string): number | undefined {
    return s ? parseInt(s, 10) : undefined;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const updates: Partial<MatchEntry> = {
      result,
      performanceRating: performance,
      wentWell: wentWell.trim() || undefined,
      couldBeBetter: couldBeBetter.trim() || undefined,
      nextFocus: nextFocus.trim() || undefined,
      gratitude: gratitude.trim() || undefined,
      lessonLearned: lessonLearned.trim() || undefined,
    };

    if (sport === "wrestling") {
      const w: WrestlingMatchDetails = {
        winType,
        myScore: parseN(myScore),
        theirScore: parseN(theirScore),
      };
      updates.wrestling = w;
    } else {
      const filteredSets = setScores
        .map((s) => ({ us: parseN(s.us), them: parseN(s.them) }))
        .filter((s) => s.us != null && s.them != null) as {
        us: number;
        them: number;
      }[];
      const v: VolleyballMatchDetails = {
        setScores: filteredSets.length ? filteredSets : undefined,
        positionPlayed: position,
        kills: parseN(kills),
        digs: parseN(digs),
        assists: parseN(assists),
        blocks: parseN(blocks),
        aces: parseN(aces),
        errors: parseN(errors),
      };
      updates.volleyball = v;
    }

    onSave(updates);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Result */}
      <div className="card">
        <Label>Result</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["win", "loss", "tie"] as MatchResult[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setResult(result === r ? undefined : r)}
              className={`py-3 rounded-xl border-2 font-bold text-sm uppercase tracking-wider transition ${
                result === r
                  ? r === "win"
                    ? "bg-green-500 text-white border-green-500"
                    : r === "loss"
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-slate-500 text-white border-slate-500"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Sport-specific stats */}
      {sport === "wrestling" ? (
        <div className="card space-y-4">
          <Label>How the match ended</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(WRESTLING_WIN_TYPE_LABELS) as [
              WrestlingWinType,
              string
            ][]).map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => setWinType(winType === key ? undefined : key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                  winType === key
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>My Score</Label>
              <input
                type="number"
                value={myScore}
                onChange={(e) => setMyScore(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <Label>Their Score</Label>
              <input
                type="number"
                value={theirScore}
                onChange={(e) => setTheirScore(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="card space-y-4">
          <div>
            <Label>Position Played</Label>
            <select
              value={position ?? ""}
              onChange={(e) =>
                setPosition(
                  e.target.value
                    ? (e.target.value as VolleyballPosition)
                    : undefined
                )
              }
              className={inputCls}
            >
              <option value="">—</option>
              {VOLLEYBALL_POSITION_ORDER.map((p) => (
                <option key={p} value={p}>
                  {VOLLEYBALL_POSITION_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Set Scores</Label>
            <div className="space-y-2">
              {setScores.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-12">
                    Set {idx + 1}
                  </span>
                  <input
                    type="number"
                    value={s.us}
                    placeholder="Us"
                    onChange={(e) => {
                      const next = [...setScores];
                      next[idx] = { ...next[idx], us: e.target.value };
                      setSetScores(next);
                    }}
                    className="w-16 rounded-lg border-2 border-slate-200 px-2 py-1.5 text-sm text-center"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    value={s.them}
                    placeholder="Them"
                    onChange={(e) => {
                      const next = [...setScores];
                      next[idx] = { ...next[idx], them: e.target.value };
                      setSetScores(next);
                    }}
                    className="w-16 rounded-lg border-2 border-slate-200 px-2 py-1.5 text-sm text-center"
                  />
                  {setScores.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSet(idx)}
                      className="text-slate-400 text-xs hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {setScores.length < 5 && (
                <button
                  type="button"
                  onClick={addSet}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  + Add set
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatField label="Kills" value={kills} onChange={setKills} />
            <StatField label="Digs" value={digs} onChange={setDigs} />
            <StatField label="Assists" value={assists} onChange={setAssists} />
            <StatField label="Blocks" value={blocks} onChange={setBlocks} />
            <StatField label="Aces" value={aces} onChange={setAces} />
            <StatField label="Errors" value={errors} onChange={setErrors} />
          </div>
        </div>
      )}

      {/* Performance rating */}
      <div className="card">
        <Label>My performance</Label>
        <div className="grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as Mood[]).map((n) => (
            <button
              type="button"
              key={n}
              onClick={() =>
                setPerformance(performance === n ? undefined : n)
              }
              className={`py-2.5 rounded-xl border-2 font-bold text-sm transition ${
                performance === n
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {n}/5
            </button>
          ))}
        </div>
      </div>

      {/* Well / Better / Next */}
      <div className="card bg-gradient-to-br from-emerald-50 to-white border-emerald-100 space-y-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-emerald-600" />
          <h2 className="font-bold text-slate-900">Well / Better / Next</h2>
        </div>
        <div>
          <Label>✅ What went well</Label>
          <textarea
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            rows={2}
            placeholder="Kept my stance low. Made two clean takedowns."
            className={textareaCls}
          />
        </div>
        <div>
          <Label>🔧 What could have been better</Label>
          <textarea
            value={couldBeBetter}
            onChange={(e) => setBetter(e.target.value)}
            rows={2}
            placeholder="Got caught flat in the scramble. Need to chain attacks."
            className={textareaCls}
          />
        </div>
        <div>
          <Label>➡️ What I&apos;ll focus on next</Label>
          <textarea
            value={nextFocus}
            onChange={(e) => setNext(e.target.value)}
            rows={2}
            placeholder="Drill my level change setup 20 reps daily this week."
            className={textareaCls}
          />
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <Label>🙏 Gratitude (optional)</Label>
          <textarea
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            rows={2}
            placeholder="Coach's game plan. Team cheering me on."
            className={textareaCls}
          />
        </div>
        <div>
          <Label>💡 Lesson learned (optional)</Label>
          <textarea
            value={lessonLearned}
            onChange={(e) => setLesson(e.target.value)}
            rows={2}
            placeholder="When I trust my training, I wrestle freely."
            className={textareaCls}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          {match.postMatchCompletedAt
            ? "Save Changes"
            : "Save Reflection +30 XP"}
        </button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2">
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
        {label}
      </div>
      <div className="text-sm text-slate-800 mt-0.5 whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}

function MoodChip({ mood }: { mood: Mood }) {
  const emoji = ["😩", "😕", "😐", "🙂", "🔥"][mood - 1];
  return <span className="text-lg">{emoji}</span>;
}

function ResultBadge({ result }: { result: MatchResult }) {
  if (result === "win")
    return (
      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
        WIN
      </span>
    );
  if (result === "loss")
    return (
      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
        LOSS
      </span>
    );
  return (
    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
      TIE
    </span>
  );
}

function ScoreText({ match }: { match: MatchEntry }) {
  if (match.wrestling?.myScore != null && match.wrestling.theirScore != null) {
    const wt = match.wrestling.winType
      ? ` · ${WRESTLING_WIN_TYPE_LABELS[match.wrestling.winType]}`
      : "";
    return (
      <span className="text-sm text-slate-600 tabular-nums">
        {match.wrestling.myScore}-{match.wrestling.theirScore}
        {wt}
      </span>
    );
  }
  if (match.volleyball?.setScores?.length) {
    return (
      <span className="text-sm text-slate-600 tabular-nums">
        {match.volleyball.setScores
          .map((s) => `${s.us}-${s.them}`)
          .join(", ")}
      </span>
    );
  }
  return null;
}

function StatField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-2 border-slate-200 px-2 py-1.5 text-sm text-center"
      />
    </div>
  );
}

function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const inputCls =
  "w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 outline-none transition";

const textareaCls = inputCls + " min-h-[72px] resize-none";

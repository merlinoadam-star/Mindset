import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { lessonsForSport, type MentalLesson } from "../lib/lessons";
import { showReward } from "../components/RewardToast";
import SpeakButton from "../components/SpeakButton";
import { ArrowLeft, BookOpen, ChevronRight, Check } from "lucide-react";

export default function LessonsPage() {
  const { state } = useStore();
  const [active, setActive] = useState<MentalLesson | null>(null);

  if (!state.profile) return null;

  const lessons = lessonsForSport(state.profile.sport);
  const completedIds = new Set(
    state.mentalSessions.filter((s) => s.kind === "lesson").map((s) => s.refId)
  );

  if (active) {
    return <LessonReader lesson={active} onClose={() => setActive(null)} />;
  }

  const categories = {
    mindset: "Mindset",
    confidence: "Confidence",
    pressure: "Handling Pressure",
    focus: "Focus",
    identity: "Identity",
  } as const;

  const byCategory: Record<string, MentalLesson[]> = {
    mindset: [],
    confidence: [],
    pressure: [],
    focus: [],
    identity: [],
  };
  lessons.forEach((l) => byCategory[l.category].push(l));

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <BookOpen size={18} />
          </div>
          <h1 className="page-title">Mental Skills</h1>
        </div>
        <p className="page-subtitle">
          {completedIds.size} of {lessons.length} lessons completed
        </p>
      </header>

      {Object.entries(categories).map(([key, label]) =>
        byCategory[key].length === 0 ? null : (
          <section key={key}>
            <h2 className="section-label mb-2 px-1">{label}</h2>
            <div className="space-y-2">
              {byCategory[key].map((l) => {
                const done = completedIds.has(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => setActive(l)}
                    className="w-full card-interactive text-left flex items-center gap-3"
                  >
                    <div className="text-3xl">{l.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {l.title}
                        {done && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                            <Check size={10} strokeWidth={3} /> Done
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {l.subtitle}
                      </div>
                      <div className="text-[11px] font-bold text-amber-700 mt-1">
                        {l.durationMin} min read · +{l.xp} XP
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-slate-300 flex-shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Reader
// -----------------------------------------------------------------------------
function LessonReader({
  lesson,
  onClose,
}: {
  lesson: MentalLesson;
  onClose: () => void;
}) {
  const { state, completeMentalSession } = useStore();
  const already = state.mentalSessions.some(
    (s) => s.kind === "lesson" && s.refId === lesson.id
  );
  const [reflection, setReflection] = useState("");

  function finish() {
    if (!already) {
      const { awardedXp, newlyUnlocked } = completeMentalSession(
        "lesson",
        lesson.id,
        lesson.xp
      );
      showReward(awardedXp, newlyUnlocked);
    }
    onClose();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> All Lessons
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-5xl mb-2">{lesson.emoji}</div>
            <h1 className="page-title">{lesson.title}</h1>
            <p className="page-subtitle">{lesson.subtitle}</p>
          </div>
          <SpeakButton
            text={
              `${lesson.title}. ${lesson.subtitle}. ` +
              lesson.sections
                .map((s) => `${s.heading}. ${s.body}`)
                .join(" ") +
              ` Reflection. ${lesson.reflectionPrompt}`
            }
            label="Listen"
            rate={0.95}
          />
        </div>
      </header>

      <div className="card space-y-5">
        {lesson.sections.map((s) => (
          <div key={s.heading}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1.5">
                {s.heading}
              </h2>
              <SpeakButton
                text={`${s.heading}. ${s.body}`}
                size="sm"
                rate={0.95}
              />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="card bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900 border-amber-100 dark:border-amber-900">
        <div className="text-xs uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 mb-2">
          Reflection
        </div>
        <p className="text-sm text-slate-800 dark:text-slate-100 font-semibold mb-3">
          {lesson.reflectionPrompt}
        </p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={3}
          placeholder="Type your answer here..."
          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:border-brand-500 dark:focus:border-brand-400 outline-none"
        />
      </div>

      <button onClick={finish} className="btn-primary w-full">
        {already ? "Close" : `Complete Lesson +${lesson.xp} XP`}
      </button>
    </div>
  );
}

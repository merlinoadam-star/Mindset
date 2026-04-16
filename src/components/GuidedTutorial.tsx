import { useEffect, useMemo, useState } from "react";
import {
  Smartphone,
  UserPlus,
  Users,
  User,
  Brain,
  Target,
  CheckSquare,
  Dumbbell,
  Calendar,
  Sparkles,
  Swords,
  Zap,
  ChevronRight,
  Share,
  Download,
  X,
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useStore } from "../lib/store";
import { useInstallPrompt } from "../lib/useInstallPrompt";
import { supabase } from "../lib/supabase";
import { todayISO, currentWeekMondayISO } from "../lib/gamification";

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = "mindset-tutorial-v1";
const GUIDE_ENABLED_KEY = "mindset-guide-enabled";
const DAILY_DISMISS_KEY = "mindset-guide-daily-dismiss";

interface TutorialState {
  dismissed: boolean;
  skippedSteps: string[];
}

function loadTutorialState(): TutorialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissed: false, skippedSteps: [] };
    return JSON.parse(raw) as TutorialState;
  } catch {
    return { dismissed: false, skippedSteps: [] };
  }
}

function saveTutorialState(s: TutorialState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function isGuideEnabled(): boolean {
  return localStorage.getItem(GUIDE_ENABLED_KEY) !== "0";
}

export function setGuideEnabled(on: boolean): void {
  localStorage.setItem(GUIDE_ENABLED_KEY, on ? "1" : "0");
}

/** Check if a daily recommendation was dismissed today. */
function isDailyDismissed(key: string): boolean {
  try {
    const raw = localStorage.getItem(DAILY_DISMISS_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[key] === todayISO();
  } catch {
    return false;
  }
}

function dismissDaily(key: string) {
  try {
    const raw = localStorage.getItem(DAILY_DISMISS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[key] = todayISO();
    localStorage.setItem(DAILY_DISMISS_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Recommendation {
  key: string;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SETUP_STEPS = 4;

export default function GuidedTutorial() {
  const { configured, account, user } = useAuth();
  const { state } = useStore();
  const { isInstalled, isIos, canInstall, promptInstall } =
    useInstallPrompt();
  const [tutorialState, setTutorialState] = useState(loadTutorialState);
  const [hasConnection, setHasConnection] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [guideOn] = useState(isGuideEnabled);
  const [dailyDismissKey, setDailyDismissKey] = useState(0); // bump to re-check

  // Check for connections
  useEffect(() => {
    if (!supabase || !user) return;
    (async () => {
      const { count } = await supabase
        .from("connections")
        .select("id", { head: true, count: "exact" })
        .or(
          `athlete_account_id.eq.${user.id},other_account_id.eq.${user.id}`
        );
      if ((count ?? 0) > 0) setHasConnection(true);
    })();
  }, [user]);

  // --- Setup step detection ---
  const installDone =
    isInstalled || tutorialState.skippedSteps.includes("install");
  const accountDone =
    Boolean(account) || tutorialState.skippedSteps.includes("account");
  const connectionDone =
    hasConnection || tutorialState.skippedSteps.includes("connection");
  const p = state.profile;
  const profileDone =
    tutorialState.skippedSteps.includes("profile") ||
    (p
      ? Boolean(
          (p.teamName || p.heightInches || p.weightLbs) &&
            (p.sport === "wrestling"
              ? p.weightClass || p.wrestlingStyles?.length
              : p.primaryPosition)
        )
      : false);

  const setupComplete = installDone && accountDone && connectionDone && profileDone;

  // --- Daily recommendation ---
  const today = todayISO();
  const thisWeek = currentWeekMondayISO();

  const dailyRec: Recommendation | null = useMemo(() => {
    if (!state.profile || !setupComplete) return null;

    // 1. Mental check-in (highest daily priority)
    const hasCheckin = state.checkins.some((c) => c.date === today);
    if (!hasCheckin && !isDailyDismissed("checkin")) {
      return {
        key: "checkin",
        icon: <Brain size={18} />,
        iconColor: "from-purple-500 to-brand-600",
        title: "Daily mental check-in",
        desc: "How are you feeling today? Take a moment to check in with yourself.",
        href: "/mindset",
        cta: "Check in",
      };
    }

    // 2. Set today's goal
    const todayCheckin = state.checkins.find((c) => c.date === today);
    const hasGoal = todayCheckin?.goal;
    if (!hasGoal && !isDailyDismissed("goal")) {
      return {
        key: "goal",
        icon: <Target size={18} />,
        iconColor: "from-amber-500 to-orange-600",
        title: "Set today's goal",
        desc: "What's one thing you want to focus on today?",
        href: "/mindset",
        cta: "Set a goal",
      };
    }

    // 3. Check off habits
    const habitsDoneToday = new Set(
      state.habitCompletions.filter((c) => c.date === today).map((c) => c.habitId)
    ).size;
    if (habitsDoneToday === 0 && !isDailyDismissed("habits")) {
      return {
        key: "habits",
        icon: <CheckSquare size={18} />,
        iconColor: "from-emerald-500 to-green-600",
        title: "Check off today's habits",
        desc: "Build your streak — tap each habit you did today.",
        href: "/habits",
        cta: "View habits",
      };
    }

    // 4. Log a practice (afternoon/evening)
    const hour = new Date().getHours();
    const hasPracticeToday = state.practices.some((pr) => pr.date === today);
    if (hour >= 15 && !hasPracticeToday && !isDailyDismissed("practice")) {
      return {
        key: "practice",
        icon: <Dumbbell size={18} />,
        iconColor: "from-sky-500 to-blue-600",
        title: "Log today's practice",
        desc: "Did you train today? Logging it earns XP and tracks your volume.",
        href: "/practice",
        cta: "Log practice",
      };
    }

    // 5. Weekly review (Sunday from noon)
    const dow = new Date().getDay();
    const hasReview = state.weeklyReviews.some(
      (r) => r.weekStartDate === thisWeek
    );
    if (dow === 0 && hour >= 12 && !hasReview && !isDailyDismissed("review")) {
      return {
        key: "review",
        icon: <Calendar size={18} />,
        iconColor: "from-indigo-500 to-purple-600",
        title: "Weekly review time",
        desc: "It's Sunday — reflect on your wins, challenges, and what you learned.",
        href: "/review",
        cta: "Start review",
      };
    }

    // 6. Post-match reflection (if recent match without reflection)
    const unreflectedMatch = state.matches.find(
      (m) => m.result && !m.postMatchCompletedAt
    );
    if (unreflectedMatch && !isDailyDismissed("matchreflect")) {
      return {
        key: "matchreflect",
        icon: <Swords size={18} />,
        iconColor: "from-rose-500 to-red-600",
        title: "Reflect on your match",
        desc: `vs ${unreflectedMatch.opponent ?? "your opponent"} — what went well? What's next?`,
        href: "/matches",
        cta: "Reflect now",
      };
    }

    // 7. Milestone: create first power phrase (one-time)
    if (state.powerPhrases.length === 0 && !isDailyDismissed("phrase")) {
      return {
        key: "phrase",
        icon: <Zap size={18} />,
        iconColor: "from-amber-500 to-yellow-600",
        title: "Create a power phrase",
        desc: "Write a short mantra that fires you up before competition.",
        href: "/phrases",
        cta: "Create one",
      };
    }

    // 8. Try a visualization (one-time)
    if (
      (!state.mentalSessions || state.mentalSessions.length === 0) &&
      !isDailyDismissed("visualization")
    ) {
      return {
        key: "visualization",
        icon: <Sparkles size={18} />,
        iconColor: "from-teal-500 to-cyan-600",
        title: "Try a visualization",
        desc: "Close your eyes and walk through a perfect performance.",
        href: "/visualize",
        cta: "Start visualizing",
      };
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.profile,
    state.checkins,
    state.habitCompletions,
    state.practices,
    state.weeklyReviews,
    state.matches,
    state.powerPhrases,
    state.mentalSessions,
    setupComplete,
    today,
    thisWeek,
    dailyDismissKey,
  ]);

  if (!guideOn) return null;
  if (tutorialState.dismissed && !setupComplete) return null;

  // ---------------------------------------------------------------------------
  // Setup mode — show the 4 sequential steps
  // ---------------------------------------------------------------------------

  if (!setupComplete) {
    let currentStep: "install" | "account" | "connection" | "profile";
    let stepNumber: number;
    if (!installDone) {
      currentStep = "install";
      stepNumber = 1;
    } else if (!accountDone) {
      currentStep = "account";
      stepNumber = 2;
    } else if (!connectionDone) {
      currentStep = "connection";
      stepNumber = 3;
    } else {
      currentStep = "profile";
      stepNumber = 4;
    }

    const skip = (step: string) => {
      const next = {
        ...tutorialState,
        skippedSteps: [...tutorialState.skippedSteps, step],
      };
      saveTutorialState(next);
      setTutorialState(next);
    };

    const dismissAll = () => {
      const next = { ...tutorialState, dismissed: true };
      saveTutorialState(next);
      setTutorialState(next);
    };

    return (
      <div className="card bg-gradient-to-br from-brand-50 via-purple-50 to-white border-brand-200 relative animate-slide-up">
        <button
          onClick={dismissAll}
          aria-label="Dismiss tutorial"
          className="absolute top-2 right-2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 flex items-center justify-center"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-3 pr-6">
          <div className="text-[10px] uppercase tracking-wider font-bold text-brand-700">
            Getting started
          </div>
          <div className="flex-1" />
          <div className="text-[10px] text-slate-500 font-semibold">
            Step {stepNumber} of {SETUP_STEPS}
          </div>
        </div>
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: SETUP_STEPS }, (_, i) => i + 1).map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < stepNumber
                  ? "bg-emerald-400"
                  : i === stepNumber
                  ? "bg-brand-500"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {currentStep === "install" && (
          <SetupStep
            icon={<Smartphone size={18} />}
            iconColor="from-brand-600 to-purple-600"
            title="Install on your device"
            desc="Add Mindset to your home screen so it opens like a real app — faster, with push notifications, and no browser bar."
          >
            {canInstall && (
              <button
                onClick={promptInstall}
                className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
              >
                <Download size={13} /> Install now
              </button>
            )}
            {isIos && !canInstall && (
              <>
                {!showIosSteps ? (
                  <button
                    onClick={() => setShowIosSteps(true)}
                    className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
                  >
                    <Download size={13} /> How to install
                  </button>
                ) : (
                  <div className="mt-3 space-y-2 text-xs text-slate-700">
                    <IosStep n={1}>
                      Tap the <Share size={11} className="inline" />{" "}
                      <strong>Share</strong> button at the bottom of Safari
                    </IosStep>
                    <IosStep n={2}>
                      Scroll down → tap <strong>Add to Home Screen</strong>
                    </IosStep>
                    <IosStep n={3}>
                      Tap <strong>Add</strong> → open Mindset from your home
                      screen
                    </IosStep>
                  </div>
                )}
                <SkipButton onClick={() => skip("install")} label="I already installed it" />
              </>
            )}
            {!canInstall && !isIos && (
              <>
                <div className="text-xs text-slate-500 mt-2">
                  Open in Chrome or Edge to get the install option.
                </div>
                <SkipButton onClick={() => skip("install")} />
              </>
            )}
          </SetupStep>
        )}

        {currentStep === "account" && (
          <SetupStep
            icon={<UserPlus size={18} />}
            iconColor="from-emerald-500 to-green-600"
            title="Create your account"
            desc="Sign up to save your data to the cloud. That way it follows you across devices and your coach or parent can connect with you."
          >
            {configured ? (
              <a
                href="/auth"
                className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
              >
                <UserPlus size={13} /> Create account
              </a>
            ) : (
              <div className="text-xs text-amber-700 mt-2">
                Cloud sync isn&apos;t configured yet.
              </div>
            )}
            <SkipButton onClick={() => skip("account")} />
          </SetupStep>
        )}

        {currentStep === "connection" && (
          <SetupStep
            icon={<Users size={18} />}
            iconColor="from-sky-500 to-blue-600"
            title="Connect with your coach or parent"
            desc="Your coach can set weekly focus areas, send cheers, and see your progress. Your parent can follow along too."
          >
            <a
              href="/connections"
              className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
            >
              <Users size={13} /> Go to Connections
              <ChevronRight size={12} />
            </a>
            <SkipButton onClick={() => skip("connection")} label="I'll do this later" />
          </SetupStep>
        )}

        {currentStep === "profile" && (
          <SetupStep
            icon={<User size={18} />}
            iconColor="from-amber-500 to-orange-600"
            title="Complete your athlete profile"
            desc={
              state.profile?.sport === "wrestling"
                ? "Add your team, weight class, wrestling style, and physical stats. Your coach sees this info."
                : "Add your team, position, and physical stats. Your coach sees this info."
            }
          >
            <a
              href="/profile"
              className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
            >
              <User size={13} /> Go to Profile
              <ChevronRight size={12} />
            </a>
            <SkipButton onClick={() => skip("profile")} label="I'll do this later" />
          </SetupStep>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Daily mode — contextual recommendations
  // ---------------------------------------------------------------------------

  if (!dailyRec) return null;

  const handleDismissDaily = () => {
    dismissDaily(dailyRec.key);
    setDailyDismissKey((k) => k + 1);
  };

  return (
    <div className="card bg-gradient-to-br from-brand-50/60 to-white border-brand-100 relative animate-slide-up">
      <button
        onClick={handleDismissDaily}
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 flex items-center justify-center"
      >
        <X size={14} />
      </button>

      <div className="text-[10px] uppercase tracking-wider font-bold text-brand-600 mb-3 flex items-center gap-1.5">
        <Sparkles size={10} /> Suggested next step
      </div>

      <div className="flex items-start gap-3 pr-6">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dailyRec.iconColor} text-white flex items-center justify-center flex-shrink-0`}
        >
          {dailyRec.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">{dailyRec.title}</div>
          <div className="text-xs text-slate-600 mt-0.5 leading-snug">
            {dailyRec.desc}
          </div>
          <a
            href={dailyRec.href}
            className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
          >
            {dailyRec.cta}
            <ChevronRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SetupStep({
  icon,
  iconColor,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconColor} text-white flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900">{title}</div>
        <div className="text-xs text-slate-600 mt-0.5 leading-snug">
          {desc}
        </div>
        {children}
      </div>
    </div>
  );
}

function SkipButton({
  onClick,
  label = "Skip for now",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-3 block text-[11px] text-slate-500 hover:text-slate-700 font-medium"
    >
      {label} →
    </button>
  );
}

function IosStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
        {n}
      </div>
      <div>{children}</div>
    </div>
  );
}

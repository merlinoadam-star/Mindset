import { useEffect, useMemo, useState } from "react";
import {
  Smartphone,
  Users,
  Eye,
  Heart,
  Target,
  MessageSquare,
  ChevronRight,
  Share,
  Download,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useInstallPrompt } from "../lib/useInstallPrompt";
import { supabase } from "../lib/supabase";
import { isGuideEnabled, setGuideEnabled } from "./GuidedTutorial";

/**
 * Coach / parent guided experience. Mirrors the athlete GuidedTutorial
 * but with coach-specific steps:
 *
 * Setup:
 *   1. Install the app
 *   2. Connect with an athlete
 *   3. View your athlete's profile (tap into an athlete)
 *
 * Ongoing:
 *   - Set this week's focus (if not set)
 *   - Send a cheer
 *   - Leave a note on a match
 */

const STORAGE_KEY = "mindset-coach-tutorial-v1";
const DAILY_DISMISS_KEY = "mindset-coach-daily-dismiss";

interface TutorialState {
  skippedSteps: string[];
  viewedAthlete: boolean;
}

function loadState(): TutorialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { skippedSteps: [], viewedAthlete: false };
    return JSON.parse(raw) as TutorialState;
  } catch {
    return { skippedSteps: [], viewedAthlete: false };
  }
}

function saveState(s: TutorialState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

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
  } catch {}
}

interface Recommendation {
  key: string;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  desc: string;
  href?: string;
  cta: string;
}

const SETUP_STEPS = 3;

export default function CoachGuidedTutorial({
  hasAcceptedAthletes,
  athleteIds,
}: {
  hasAcceptedAthletes: boolean;
  athleteIds: string[];
}) {
  const { account, user } = useAuth();
  const { isInstalled, isIos, canInstall, promptInstall } =
    useInstallPrompt();
  const [state, setState] = useState(loadState);
  const [guideOn, setGuideOn] = useState(isGuideEnabled);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [dailyBump, setDailyBump] = useState(0);
  const [hasFocusThisWeek, setHasFocusThisWeek] = useState(false);

  // Check if coach set a weekly focus this week for any athlete
  useEffect(() => {
    if (!supabase || !user || athleteIds.length === 0) return;
    const monday = (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      return d.toISOString().slice(0, 10);
    })();
    (async () => {
      const { count } = await supabase
        .from("weekly_focus")
        .select("id", { head: true, count: "exact" })
        .eq("author_id", user.id)
        .eq("week_start_date", monday);
      if ((count ?? 0) > 0) setHasFocusThisWeek(true);
    })();
  }, [user, athleteIds]);

  // Detect if they've viewed an athlete (check URL history)
  useEffect(() => {
    if (state.viewedAthlete) return;
    // If current path starts with /athlete/, they're viewing one now
    if (window.location.pathname.startsWith("/athlete/")) {
      const next = { ...state, viewedAthlete: true };
      saveState(next);
      setState(next);
    }
  }, [state]);

  const roleLabel =
    account?.role === "coach" ? "Coach" : "Parent";

  // --- Setup steps ---
  const installDone =
    isInstalled || state.skippedSteps.includes("install");
  const connectDone =
    hasAcceptedAthletes || state.skippedSteps.includes("connect");
  const viewDone =
    state.viewedAthlete || state.skippedSteps.includes("view");

  const setupComplete = installDone && connectDone && viewDone;

  // --- Daily mode: contextual recommendations ---
  // Must be computed before any early returns to keep hook count stable.
  const dailyRec: Recommendation | null = useMemo(() => {
    if (!setupComplete || !hasAcceptedAthletes) return null;

    if (!hasFocusThisWeek && !isDailyDismissed("focus")) {
      return {
        key: "focus",
        icon: <Target size={18} />,
        iconColor: "from-amber-500 to-orange-600",
        title: "Set this week's focus",
        desc: "Give your athlete a concrete theme to work on. Tap into their profile to set it.",
        href: athleteIds[0] ? `/athlete/${athleteIds[0]}` : undefined,
        cta: "Open athlete",
      };
    }

    if (!isDailyDismissed("cheer")) {
      return {
        key: "cheer",
        icon: <Heart size={18} />,
        iconColor: "from-pink-500 to-rose-600",
        title: "Send a cheer",
        desc: "A quick \"Proud of you!\" goes a long way. Tap into your athlete's page to send one.",
        href: athleteIds[0] ? `/athlete/${athleteIds[0]}` : undefined,
        cta: "Open athlete",
      };
    }

    if (!isDailyDismissed("note")) {
      return {
        key: "note",
        icon: <MessageSquare size={18} />,
        iconColor: "from-brand-500 to-purple-600",
        title: "Leave a note",
        desc: "See a match or video your athlete posted? Leave feedback so they know you're watching.",
        href: athleteIds[0] ? `/athlete/${athleteIds[0]}` : undefined,
        cta: "Open athlete",
      };
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupComplete, hasAcceptedAthletes, hasFocusThisWeek, athleteIds, dailyBump]);

  // --- Early returns (AFTER all hooks) ---
  if (!guideOn || !account) return null;

  const skip = (step: string) => {
    const next = {
      ...state,
      skippedSteps: [...state.skippedSteps, step],
    };
    saveState(next);
    setState(next);
  };

  const dismissAll = () => {
    setGuideEnabled(false);
    setGuideOn(false);
  };

  // --- Setup mode ---
  if (!setupComplete) {
    let currentStep: "install" | "connect" | "view";
    let stepNumber: number;
    if (!installDone) {
      currentStep = "install";
      stepNumber = 1;
    } else if (!connectDone) {
      currentStep = "connect";
      stepNumber = 2;
    } else {
      currentStep = "view";
      stepNumber = 3;
    }

    return (
      <div className="card bg-gradient-to-br from-brand-50 via-purple-50 to-white border-brand-200 relative animate-slide-up">
        <button
          onClick={dismissAll}
          aria-label="Dismiss"
          className="absolute top-2 right-2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 flex items-center justify-center"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-3 pr-6">
          <div className="text-[10px] uppercase tracking-wider font-bold text-brand-700">
            {roleLabel} setup
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
          <StepCard
            icon={<Smartphone size={18} />}
            iconColor="from-brand-600 to-purple-600"
            title="Install Mindset"
            desc="Add to your home screen for push notifications when your athlete levels up or logs activity."
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
                      Tap <Share size={11} className="inline" />{" "}
                      <strong>Share</strong> at the bottom of Safari
                    </IosStep>
                    <IosStep n={2}>
                      Tap <strong>Add to Home Screen</strong>
                    </IosStep>
                    <IosStep n={3}>
                      Tap <strong>Add</strong> — open from home screen
                    </IosStep>
                  </div>
                )}
                <SkipBtn onClick={() => skip("install")} label="I already installed it" />
              </>
            )}
            {!canInstall && !isIos && (
              <SkipBtn onClick={() => skip("install")} />
            )}
          </StepCard>
        )}

        {currentStep === "connect" && (
          <StepCard
            icon={<Users size={18} />}
            iconColor="from-emerald-500 to-green-600"
            title="Connect with your athlete"
            desc="Your athlete can invite you by email, or you can invite them. Once connected, you'll see their full training data."
          >
            <a
              href="/connections"
              className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
            >
              <Users size={13} /> Go to Connections
              <ChevronRight size={12} />
            </a>
            <SkipBtn onClick={() => skip("connect")} label="I'll do this later" />
          </StepCard>
        )}

        {currentStep === "view" && (
          <StepCard
            icon={<Eye size={18} />}
            iconColor="from-sky-500 to-blue-600"
            title="View your athlete"
            desc="Tap their name below to see their profile, match log, progress charts, and more. That's where you'll set focus areas and leave notes."
          >
            {hasAcceptedAthletes ? (
              <div className="text-xs text-emerald-700 font-semibold mt-2">
                Your athletes are listed below — tap one to continue.
              </div>
            ) : (
              <div className="text-xs text-slate-500 mt-2">
                Connect with an athlete first, then tap their name here.
              </div>
            )}
            <SkipBtn onClick={() => skip("view")} />
          </StepCard>
        )}
      </div>
    );
  }

  if (!dailyRec) return null;

  const handleDismissDaily = () => {
    dismissDaily(dailyRec.key);
    setDailyBump((k) => k + 1);
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
        <Sparkles size={10} /> Suggested for you
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
          {dailyRec.href && (
            <a
              href={dailyRec.href}
              className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
            >
              {dailyRec.cta}
              <ChevronRight size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StepCard({
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

function SkipBtn({
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

import { useEffect, useState } from "react";
import {
  Smartphone,
  UserPlus,
  Users,
  User,
  ChevronRight,
  Check,
  Share,
  Download,
  X,
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useStore } from "../lib/store";
import { useInstallPrompt } from "../lib/useInstallPrompt";
import { supabase } from "../lib/supabase";

/**
 * Phase 5 — guided tutorial for new users. Shows as a card at the top
 * of the dashboard, one step at a time, until all 3 setup tasks are
 * done or the user dismisses the tutorial.
 *
 * Steps:
 *   1. Install the app (Add to Home Screen / native install)
 *   2. Create an account (sign up)
 *   3. Connect with coach or parent (send first invite)
 *
 * Auto-advances when it detects a step was completed (e.g., app
 * is now in standalone mode, user signed in, connection exists).
 */

type TutorialStep =
  | "install"
  | "account"
  | "connection"
  | "profile"
  | "complete";

const TOTAL_STEPS = 4;
const STORAGE_KEY = "mindset-tutorial-v1";
const GUIDE_ENABLED_KEY = "mindset-guide-enabled";

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

/** Check if the guide is enabled (defaults to ON). */
export function isGuideEnabled(): boolean {
  return localStorage.getItem(GUIDE_ENABLED_KEY) !== "0";
}

/** Toggle the guide on/off. */
export function setGuideEnabled(on: boolean): void {
  localStorage.setItem(GUIDE_ENABLED_KEY, on ? "1" : "0");
}

export default function GuidedTutorial() {
  const { configured, account, user } = useAuth();
  const { state } = useStore();
  const { isInstalled, isIos, canInstall, promptInstall } =
    useInstallPrompt();
  const [tutorialState, setTutorialState] = useState(loadTutorialState);
  const [hasConnection, setHasConnection] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [guideOn] = useState(isGuideEnabled);

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

  if (tutorialState.dismissed || !guideOn) return null;

  // Determine current step based on what's actually done
  const installDone =
    isInstalled || tutorialState.skippedSteps.includes("install");
  const accountDone =
    Boolean(account) || tutorialState.skippedSteps.includes("account");
  const connectionDone =
    hasConnection || tutorialState.skippedSteps.includes("connection");

  // Profile is "done enough" when they've filled in at least a couple
  // key optional fields beyond the onboarding basics.
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

  let currentStep: TutorialStep;
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
  } else if (!profileDone) {
    currentStep = "profile";
    stepNumber = 4;
  } else {
    currentStep = "complete";
    stepNumber = 4;
  }

  // If all done, show brief success then auto-dismiss
  useEffect(() => {
    if (currentStep === "complete") {
      const t = window.setTimeout(() => {
        const next = { ...tutorialState, dismissed: true };
        saveTutorialState(next);
        setTutorialState(next);
      }, 3000);
      return () => window.clearTimeout(t);
    }
  }, [currentStep]);

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

  if (currentStep === "complete") {
    return (
      <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
            <Check size={20} strokeWidth={3} />
          </div>
          <div>
            <div className="font-bold text-emerald-900">
              You&apos;re all set!
            </div>
            <div className="text-xs text-emerald-700">
              Enjoy the app. Your journey starts now.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-br from-brand-50 via-purple-50 to-white border-brand-200 relative animate-slide-up">
      {/* Dismiss button */}
      <button
        onClick={dismissAll}
        aria-label="Dismiss tutorial"
        className="absolute top-2 right-2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 flex items-center justify-center"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3 pr-6">
        <div className="text-[10px] uppercase tracking-wider font-bold text-brand-700">
          Getting started
        </div>
        <div className="flex-1" />
        <div className="text-[10px] text-slate-500 font-semibold">
          Step {stepNumber} of {TOTAL_STEPS}
        </div>
      </div>
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
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

      {/* Step 1: Install */}
      {currentStep === "install" && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
            <Smartphone size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900">
              Install on your device
            </div>
            <div className="text-xs text-slate-600 mt-0.5 leading-snug">
              Add Mindset to your home screen so it opens like a real app —
              faster, with push notifications, and no browser bar.
            </div>

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
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                        1
                      </div>
                      <div>
                        Tap the <Share size={11} className="inline" />{" "}
                        <strong>Share</strong> button at the bottom of Safari
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                        2
                      </div>
                      <div>
                        Scroll down → tap{" "}
                        <strong>Add to Home Screen</strong>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                        3
                      </div>
                      <div>
                        Tap <strong>Add</strong> → open Mindset from your
                        home screen
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => skip("install")}
                  className="mt-3 text-[11px] text-slate-500 hover:text-slate-700 font-medium"
                >
                  I already installed it →
                </button>
              </>
            )}

            {!canInstall && !isIos && (
              <>
                <div className="text-xs text-slate-500 mt-2">
                  Open in Chrome or Edge to get the install option.
                </div>
                <button
                  onClick={() => skip("install")}
                  className="mt-2 text-[11px] text-slate-500 hover:text-slate-700 font-medium"
                >
                  Skip for now →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Create account */}
      {currentStep === "account" && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center flex-shrink-0">
            <UserPlus size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900">Create your account</div>
            <div className="text-xs text-slate-600 mt-0.5 leading-snug">
              Sign up to save your data to the cloud. That way it follows you
              across devices and your coach or parent can connect with you.
            </div>
            {configured ? (
              <a
                href="/auth"
                className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
              >
                <UserPlus size={13} /> Create account
              </a>
            ) : (
              <div className="text-xs text-amber-700 mt-2">
                Cloud sync isn&apos;t configured yet. You can still use the
                app locally.
              </div>
            )}
            <button
              onClick={() => skip("account")}
              className="mt-3 block text-[11px] text-slate-500 hover:text-slate-700 font-medium"
            >
              Skip for now →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Connect */}
      {currentStep === "connection" && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <Users size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900">
              Connect with your coach or parent
            </div>
            <div className="text-xs text-slate-600 mt-0.5 leading-snug">
              Your coach can set weekly focus areas, send cheers, and see your
              progress. Your parent can follow along too.
            </div>
            <a
              href="/connections"
              className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
            >
              <Users size={13} /> Go to Connections
              <ChevronRight size={12} />
            </a>
            <button
              onClick={() => skip("connection")}
              className="mt-3 block text-[11px] text-slate-500 hover:text-slate-700 font-medium"
            >
              I&apos;ll do this later →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete profile */}
      {currentStep === "profile" && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900">
              Complete your athlete profile
            </div>
            <div className="text-xs text-slate-600 mt-0.5 leading-snug">
              {state.profile?.sport === "wrestling"
                ? "Add your team, weight class, wrestling style, and physical stats. Your coach sees this info on their dashboard."
                : "Add your team, position, and physical stats. Your coach sees this info on their dashboard."}
            </div>
            <a
              href="/profile"
              className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
            >
              <User size={13} /> Go to Profile
              <ChevronRight size={12} />
            </a>
            <button
              onClick={() => skip("profile")}
              className="mt-3 block text-[11px] text-slate-500 hover:text-slate-700 font-medium"
            >
              I&apos;ll do this later →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

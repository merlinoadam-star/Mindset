import { useState } from "react";
import { Download, Share, X, Smartphone, Check } from "lucide-react";
import { useInstallPrompt } from "../lib/useInstallPrompt";

/**
 * Phase 5 — install prompt shown on the Dashboard (for non-installed
 * users) and in Settings (always, with status).
 *
 * Android/desktop: uses the native install prompt via the hook.
 * iOS: shows step-by-step "Add to Home Screen" instructions since
 * Safari doesn't support the install prompt API.
 */

const DISMISS_KEY = "mindset-install-dismissed";

export function InstallBanner() {
  const { canInstall, isInstalled, isIos, promptInstall } =
    useInstallPrompt();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  );
  const [showIosSteps, setShowIosSteps] = useState(false);

  // Already installed or user dismissed → hide
  if (isInstalled || dismissed) return null;
  // Not installable and not iOS → nothing to show
  if (!canInstall && !isIos) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="card bg-gradient-to-br from-brand-50 to-purple-50 border-brand-200 relative">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 flex items-center justify-center"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
          <Smartphone size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">Install Mindset</div>
          <div className="text-xs text-slate-600 mt-0.5 leading-snug">
            Add to your home screen for the full app experience — faster
            loading, push notifications, and no browser bar.
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
                  <div className="font-bold text-slate-900">
                    3 quick steps in Safari:
                  </div>
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
                      Scroll down and tap{" "}
                      <strong>Add to Home Screen</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                      3
                    </div>
                    <div>
                      Tap <strong>Add</strong> — then open Mindset from your
                      home screen
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function InstallSettingsCard() {
  const { canInstall, isInstalled, isIos, promptInstall } =
    useInstallPrompt();
  const [showIosSteps, setShowIosSteps] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
          <Smartphone size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">Install App</div>

          {isInstalled ? (
            <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <Check size={12} strokeWidth={3} /> Installed on this device
            </div>
          ) : canInstall ? (
            <>
              <div className="text-xs text-slate-500 mt-0.5">
                Add to your home screen for a faster, native-like experience.
              </div>
              <button
                onClick={promptInstall}
                className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
              >
                <Download size={13} /> Install now
              </button>
            </>
          ) : isIos ? (
            <>
              <div className="text-xs text-slate-500 mt-0.5">
                On iPhone, install via Safari&apos;s Share menu.
              </div>
              {!showIosSteps ? (
                <button
                  onClick={() => setShowIosSteps(true)}
                  className="mt-2 text-xs text-brand-700 hover:text-brand-900 font-semibold"
                >
                  Show me how
                </button>
              ) : (
                <div className="mt-2 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Share size={11} className="text-slate-500" />
                    <span>
                      Tap <strong>Share</strong> at the bottom of Safari
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download size={11} className="text-slate-500" />
                    <span>
                      Tap <strong>Add to Home Screen</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={11} className="text-slate-500" />
                    <span>
                      Tap <strong>Add</strong> — done!
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-slate-500 mt-0.5">
              Open in Chrome or Edge to install as an app.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

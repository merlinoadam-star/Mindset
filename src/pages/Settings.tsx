import { useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/authContext";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Mic2,
  FileDown,
  Users,
  LogOut,
  LogIn,
  AlertTriangle,
} from "lucide-react";
import { getPersona } from "../lib/speechPersonas";
import { ACCOUNT_ROLE_EMOJIS, ACCOUNT_ROLE_LABELS } from "../types";
import NotificationsCard from "../components/NotificationsCard";
import { deleteMyAccount } from "../lib/accountLifecycle";
import {
  exportAthleteData,
  exportCoachParentData,
} from "../lib/dataExport";
import { Download } from "lucide-react";

export default function SettingsPage() {
  const { state, resetAll } = useStore();
  const { configured, account, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm">("idle");
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportErr, setExportErr] = useState<string | null>(null);

  const handleExport = async () => {
    setExportErr(null);
    setExporting(true);
    try {
      if (account && (account.role === "coach" || account.role === "parent")) {
        const { error } = await exportCoachParentData(account);
        if (error) setExportErr(error);
      } else {
        exportAthleteData(account ?? null, state);
      }
    } catch (e) {
      setExportErr((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  if (!state.profile) return null;

  return (
    <div className="space-y-4">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-2xl font-extrabold">Settings</h1>
      </header>

      {/* Account / Sync */}
      {configured && account ? (
        <div className="card bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-brand-700">
                Signed in
              </div>
              <div className="font-bold text-slate-900 mt-0.5">
                {ACCOUNT_ROLE_EMOJIS[account.role]} {account.displayName}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  ({ACCOUNT_ROLE_LABELS[account.role]})
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate">
                {account.email}
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
          <Link
            to="/connections"
            className="mt-3 flex items-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-brand-300 transition"
          >
            <Users size={16} className="text-brand-600" />
            <span className="text-sm font-bold text-slate-900 flex-1">
              Connections
            </span>
            <ChevronRight size={14} className="text-slate-300" />
          </Link>
        </div>
      ) : configured ? (
        <Link
          to="/auth"
          className="card-interactive flex items-center gap-3 bg-gradient-to-br from-brand-50 to-white border-brand-100"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
            <LogIn size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900">Sign in to sync</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Connect with your coach and parent
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </Link>
      ) : null}

      <Link
        to="/export"
        className="card-interactive flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center flex-shrink-0">
          <FileDown size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">Export Report</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Save your season summary as a PDF or print
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
      </Link>

      <Link
        to="/voice"
        className="card-interactive flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
          <Mic2 size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">Voice Persona</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {(() => {
              const p = getPersona(state.voicePersonaId ?? "natural");
              return `${p.emoji} ${p.name} — ${p.description}`;
            })()}
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
      </Link>

      <NotificationsCard />

      <div className="card">
        <h2 className="font-bold mb-3">Profile</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-semibold">{state.profile.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Sport</dt>
            <dd className="font-semibold capitalize">{state.profile.sport}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Age</dt>
            <dd className="font-semibold">{state.profile.age}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Grade</dt>
            <dd className="font-semibold">{state.profile.grade}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <h2 className="font-bold mb-3">Your Totals</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-slate-500">Total XP</dt>
            <dd className="font-semibold tabular-nums">{state.xp}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Habits completed</dt>
            <dd className="font-semibold tabular-nums">
              {state.habitCompletions.length}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Practices logged</dt>
            <dd className="font-semibold tabular-nums">
              {state.practices.length}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Check-ins</dt>
            <dd className="font-semibold tabular-nums">
              {state.checkins.length}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Badges unlocked</dt>
            <dd className="font-semibold tabular-nums">
              {state.unlockedBadges.length}
            </dd>
          </div>
        </dl>
      </div>

      {/* Data export — for everyone, always available */}
      <div className="card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center flex-shrink-0">
            <Download size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900">Download my data</div>
            <div className="text-xs text-slate-500 mt-0.5 leading-snug">
              {account && (account.role === "coach" || account.role === "parent")
                ? "Export your notes, cheers, weekly focuses, and connections as JSON."
                : "Export your profile, matches, practices, habits, and history as JSON."}
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="mt-3 btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40"
            >
              {exporting ? "Preparing..." : "Download JSON"}
            </button>
            {exportErr && (
              <div className="text-xs text-red-600 mt-2 font-medium">
                {exportErr}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card border-red-200">
        <h2 className="font-bold mb-1 text-red-700">Danger Zone</h2>
        <p className="text-sm text-slate-600 mb-3">
          Reset all data on this device. Your profile, XP, habits, practices,
          and badges will be cleared locally. If you&apos;re signed in, the
          cloud copy stays intact — this only wipes the browser.
        </p>
        {confirming ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetAll();
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-5 py-3 transition"
            >
              Yes, reset this device
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            Reset this device
          </button>
        )}
      </div>

      {/* Account deletion — only offered to signed-in users */}
      {configured && account && (
        <div className="card border-red-300 bg-red-50/30">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="font-bold text-red-800">Delete my account</h2>
              <p className="text-sm text-slate-700 mt-0.5 leading-snug">
                Permanently deletes your account, all your data, all your
                videos, and every connection. This can&apos;t be undone.
              </p>
            </div>
          </div>

          {deleteStep === "confirm" ? (
            <div className="space-y-2 mt-3">
              <label className="text-xs font-bold text-slate-600 block">
                Type <span className="font-mono text-red-700">DELETE</span> to
                confirm:
              </label>
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="w-full rounded-xl border-2 border-red-200 px-3 py-2 text-sm focus:border-red-400 outline-none"
                placeholder="DELETE"
                autoFocus
              />
              {deleteErr && (
                <div className="rounded-lg bg-red-100 border border-red-300 text-red-800 px-3 py-2 text-xs">
                  {deleteErr}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setDeleteStep("idle");
                    setDeleteText("");
                    setDeleteErr(null);
                  }}
                  className="btn-secondary"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  disabled={deleteText !== "DELETE" || deleting}
                  onClick={async () => {
                    setDeleting(true);
                    setDeleteErr(null);
                    const { error } = await deleteMyAccount();
                    if (error) {
                      setDeleteErr(error);
                      setDeleting(false);
                      return;
                    }
                    // Hard reload so the app shell re-initializes without
                    // any cached state or auth tokens.
                    window.location.href = "/";
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-5 py-3 transition"
                >
                  {deleting ? "Deleting..." : "Delete forever"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setDeleteStep("confirm")}
              className="mt-2 text-red-700 hover:text-red-900 font-semibold text-sm"
            >
              Delete my account...
            </button>
          )}
        </div>
      )}

      <div className="text-center text-xs text-slate-400 pt-4">
        Mindset · v0.1 · Phase 1
      </div>
    </div>
  );
}

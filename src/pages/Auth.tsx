import { useState } from "react";
import { useAuth } from "../lib/authContext";
import type { AccountRole } from "../types";
import { ACCOUNT_ROLE_EMOJIS, ACCOUNT_ROLE_LABELS } from "../types";
import { Mail, Lock, User as UserIcon, Sparkles } from "lucide-react";

type Mode = "signin" | "signup" | "magic";

export default function AuthPage() {
  const { configured, signIn, signUp, sendMagicLink } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AccountRole>("athlete");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, displayName, role);
        if (error) setError(error);
        else setInfo("Check your email to confirm your account.");
      } else if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else if (mode === "magic") {
        const { error } = await sendMagicLink(email);
        if (error) setError(error);
        else setInfo("Check your email for a sign-in link.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-brand-900 to-slate-800 text-white">
        <div className="max-w-md w-full bg-white text-slate-900 rounded-3xl p-6 shadow-elevated">
          <div className="text-xs uppercase tracking-[0.3em] font-bold text-brand-600">
            Sync Not Configured
          </div>
          <h1 className="text-2xl font-extrabold mt-1">
            Cloud sync coming soon
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            This app is currently running in local-only mode. To connect a
            coach or parent, the app owner needs to finish setting up the
            Supabase backend.
          </p>
          <p className="text-xs text-slate-500 mt-3">
            For now, everything you do in the app is saved securely on this
            device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-700 text-white flex flex-col">
      <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute bottom-40 left-0 w-60 h-60 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="relative max-w-md w-full mx-auto px-6 py-10 flex-1 flex flex-col">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.3em] font-bold text-brand-300">
            Mindset
          </div>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
            {mode === "signup"
              ? "Create your account"
              : mode === "magic"
              ? "Sign in with email"
              : "Welcome back"}
          </h1>
          <p className="text-white/60 mt-2 text-sm">
            {mode === "signup"
              ? "Athletes, coaches, and parents — one app, three perspectives."
              : "Sign in to sync with your coach and parent."}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white text-slate-900 rounded-3xl p-6 shadow-elevated space-y-4"
        >
          {mode === "signup" && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  I am a...
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["athlete", "coach", "parent"] as AccountRole[]).map(
                    (r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-xl border-2 text-xs font-bold transition ${
                          role === r
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        <div className="text-xl">
                          {ACCOUNT_ROLE_EMOJIS[r]}
                        </div>
                        <div className="mt-0.5">{ACCOUNT_ROLE_LABELS[r]}</div>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full rounded-xl border-2 border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                className="w-full rounded-xl border-2 border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {mode !== "magic" && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border-2 border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-40"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create Account"
              : mode === "magic"
              ? "Send Magic Link"
              : "Sign In"}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="flex-1 h-px bg-slate-200" />
            <span>or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() =>
              setMode(mode === "magic" ? "signin" : "magic")
            }
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            {mode === "magic"
              ? "Use password instead"
              : "Email me a magic link"}
          </button>

          <div className="text-center text-xs text-slate-500 pt-1">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-brand-600 font-semibold"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-brand-600 font-semibold"
                  onClick={() => setMode("signup")}
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Lock, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "../lib/authContext";

/**
 * Password reset landing page. Supabase's email link drops the user
 * on this URL with a recovery token in the URL hash; the supabase-js
 * client auto-consumes the token and creates a short-lived session.
 * From here we just let the user set a new password via updateUser().
 */
export default function ResetPasswordPage() {
  const { updatePassword, session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-redirect home after success
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return () => window.clearTimeout(t);
  }, [done]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setErr(error);
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-700 text-white flex flex-col">
      <div className="relative max-w-md w-full mx-auto px-6 py-10 flex-1 flex flex-col">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.3em] font-bold text-brand-300">
            Mindset
          </div>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
            Set a new password
          </h1>
        </div>

        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-elevated space-y-4">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : !session && !done ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-3 py-3 text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Reset link expired or invalid</div>
                <div className="mt-1">
                  Go back to the sign-in page and request a new reset link.
                </div>
                <a
                  href="/auth"
                  className="inline-block mt-2 text-amber-900 font-semibold underline"
                >
                  ← Back to sign in
                </a>
              </div>
            </div>
          ) : done ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-3 text-sm flex items-start gap-2">
              <Check size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Password updated!</div>
                <div className="mt-1">
                  You&apos;re signed in. Redirecting you home...
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  New Password
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
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Type it again"
                    className="w-full rounded-xl border-2 border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {err && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-40"
              >
                {submitting ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

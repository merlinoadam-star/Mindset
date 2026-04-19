import { useState } from "react";
import { Megaphone, Send, Check } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { postAnnouncement } from "../lib/announcementsSync";
import { showReward } from "./RewardToast";

/**
 * Coach-only composer on CoachDashboard. Simple textarea + optional
 * title + 7-day default expiry. Posts fan out to all athletes and
 * parents connected to this coach (enforced by RLS on read).
 */
export default function PostAnnouncementCard() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!account || account.role !== "coach") return null;

  const submit = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    setError(null);
    const { error } = await postAnnouncement({
      coachAccountId: account.id,
      title: title.trim() || null,
      body: body.trim(),
    });
    setSending(false);
    if (error) {
      setError(error);
      return;
    }
    setSent(true);
    setTitle("");
    setBody("");
    showReward(0, ["__combo__Announcement posted to your team"]);
    window.setTimeout(() => {
      setSent(false);
      setOpen(false);
    }, 1200);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full card-interactive flex items-center gap-3 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Megaphone size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Post an announcement
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            One message to all your athletes and their parents.
          </div>
        </div>
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0">
          <Megaphone size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-amber-700 dark:text-amber-300">
            Team announcement
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Posts to every athlete + parent connected to you.
          </div>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 120))}
        placeholder="Title (optional) — e.g. Practice moved"
        className="w-full text-sm bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:border-amber-500 outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        placeholder="Practice moved to 5pm today at the high school gym."
        rows={3}
        className="w-full text-sm bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 focus:border-amber-500 outline-none resize-none"
      />
      <div className="text-[10px] text-slate-500 dark:text-slate-400">
        Expires in 7 days.
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300 font-medium">
          Couldn't post: {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle("");
            setBody("");
            setError(null);
          }}
          className="flex-1 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 py-2 hover:bg-white/50 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || sending}
          className="flex-[1.4] inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl px-3 py-2 text-sm disabled:opacity-40"
        >
          {sent ? (
            <>
              <Check size={14} strokeWidth={3} /> Posted
            </>
          ) : sending ? (
            "Posting..."
          ) : (
            <>
              <Send size={14} /> Post to team
            </>
          )}
        </button>
      </div>
    </section>
  );
}

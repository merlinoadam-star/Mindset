import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import { fetchUnreadCount } from "../lib/feedbackSync";
import { useRealtime } from "../lib/useRealtime";
import { MessageSquare, ArrowRight } from "lucide-react";

/**
 * Shows a banner on the athlete dashboard when there are unread coach /
 * parent notes. Auto-refreshes in realtime so the banner appears the
 * moment a coach posts.
 */
export default function UnreadFeedbackBanner() {
  const { user, account, configured } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user || account?.role !== "athlete") return;
    const n = await fetchUnreadCount(user.id);
    setCount(n);
  }, [user, account]);

  useEffect(() => {
    if (!configured || !user || account?.role !== "athlete") return;
    refresh();
  }, [configured, user, account, refresh]);

  // Realtime: any change to feedback for this athlete triggers a refetch.
  useRealtime(
    {
      table: "feedback",
      filter: user ? `athlete_id=eq.${user.id}` : undefined,
      enabled: Boolean(configured && user && account?.role === "athlete"),
    },
    refresh
  );

  if (!configured || !user || account?.role !== "athlete" || count === 0) {
    return null;
  }

  return (
    <Link
      to="/feedback"
      className="block relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-brand-600 to-brand-500 text-white p-4 shadow-elevated hover:shadow-card-hover transition animate-pop-in"
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
          <MessageSquare size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">
            New notes
          </div>
          <div className="font-bold text-white mt-0.5">
            {count} new note{count === 1 ? "" : "s"} from your team
          </div>
          <div className="text-xs text-white/70 mt-0.5">
            Tap to see what your coach or parent said
          </div>
        </div>
        <ArrowRight size={16} className="text-white/70" />
      </div>
    </Link>
  );
}

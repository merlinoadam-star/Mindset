import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Send } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { supabase } from "../lib/supabase";
import { useRealtime } from "../lib/useRealtime";
import {
  fetchAdultChatThread,
  markAdultChatRead,
  sendAdultChatMessage,
  type AdultChatMessage,
  type AdultChatThreadKey,
} from "../lib/adultChatSync";

/**
 * Private coach↔parent chat about a specific athlete. The athlete
 * themselves can't reach this route — they're redirected away via the
 * role check. RLS on `adult_chats` also refuses to return rows to any
 * account that isn't the coach or parent in the thread.
 *
 * URL shape:  /chat/:athleteId/:otherId
 *   - athleteId: the athlete this conversation is ABOUT
 *   - otherId: the account id of the other adult (parent if I'm
 *     coach, coach if I'm parent)
 *
 * The page resolves which side is coach vs parent by looking up the
 * other account's role, then builds the thread key.
 */
export default function AdultChatPage() {
  const { athleteId = "", otherId = "" } = useParams();
  const { account, user } = useAuth();
  const navigate = useNavigate();

  const [otherRole, setOtherRole] = useState<"coach" | "parent" | null>(null);
  const [otherName, setOtherName] = useState<string>("");
  const [athleteName, setAthleteName] = useState<string>("");
  const [messages, setMessages] = useState<AdultChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gate: athletes don't get to see this view at all, even if they
  // paste the URL. Role guard runs after auth resolves.
  useEffect(() => {
    if (account && account.role !== "coach" && account.role !== "parent") {
      navigate("/", { replace: true });
    }
  }, [account, navigate]);

  // Resolve the other adult's role + name, and the athlete's display
  // name. This also implicitly checks that the connections exist — if
  // either is missing we show a clean "can't open this thread" message.
  useEffect(() => {
    if (!supabase || !account || !user || !athleteId || !otherId) return;
    let cancelled = false;
    (async () => {
      const [otherRes, athRes] = await Promise.all([
        supabase
          .from("accounts")
          .select("display_name, role")
          .eq("id", otherId)
          .maybeSingle(),
        supabase
          .from("accounts")
          .select("display_name")
          .eq("id", athleteId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (!otherRes.data || !athRes.data) {
        setResolveError("Couldn't find this thread. The other person may have unlinked.");
        return;
      }
      if (
        otherRes.data.role !== "coach" &&
        otherRes.data.role !== "parent"
      ) {
        setResolveError("This chat is only for coach↔parent conversations.");
        return;
      }
      // Two adults of the SAME role can't chat here (coach↔coach or
      // parent↔parent) — the table requires one of each.
      if (otherRes.data.role === account.role) {
        setResolveError(
          `You can only chat here with the ${
            account.role === "coach" ? "parent" : "coach"
          }.`
        );
        return;
      }
      setOtherRole(otherRes.data.role);
      setOtherName(otherRes.data.display_name ?? "");
      setAthleteName(athRes.data.display_name ?? "your athlete");
    })();
    return () => {
      cancelled = true;
    };
  }, [account, user, athleteId, otherId]);

  // Build the (athlete, coach, parent) triple once we know which
  // side of the pair I'm on.
  const threadKey: AdultChatThreadKey | null = useMemo(() => {
    if (!account || !otherRole) return null;
    const coach = account.role === "coach" ? account.id : otherId;
    const parent = account.role === "parent" ? account.id : otherId;
    return {
      athleteAccountId: athleteId,
      coachAccountId: coach,
      parentAccountId: parent,
    };
  }, [account, otherRole, athleteId, otherId]);

  const load = useCallback(async () => {
    if (!threadKey || !account) return;
    const { messages: msgs } = await fetchAdultChatThread(threadKey);
    setMessages(msgs);
    setLoading(false);
    // Fire-and-forget — mark everything from the other side as read.
    markAdultChatRead(threadKey, account.id);
  }, [threadKey, account]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime — any new message in this thread refreshes.
  useRealtime(
    {
      table: "adult_chats",
      filter: threadKey
        ? `athlete_account_id=eq.${threadKey.athleteAccountId}`
        : undefined,
      enabled: Boolean(threadKey),
    },
    load
  );

  // Auto-scroll to bottom whenever messages change.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!account || !user || !threadKey) return;
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setSending(true);
      setSendErr(null);
      const recipient =
        account.role === "coach" ? threadKey.parentAccountId : threadKey.coachAccountId;
      const { error } = await sendAdultChatMessage({
        key: threadKey,
        senderAccountId: account.id,
        senderRole: account.role === "coach" ? "coach" : "parent",
        senderName: account.displayName ?? "",
        recipientAccountId: recipient,
        athleteName,
        text: trimmed,
      });
      setSending(false);
      if (error) {
        setSendErr(error);
        return;
      }
      setText("");
      // Realtime will push the new row back in. As a fallback, reload
      // in ~250ms in case realtime isn't connected.
      window.setTimeout(load, 250);
    },
    [account, user, threadKey, text, sending, athleteName, load]
  );

  const backTarget = `/athlete/${athleteId}`;

  if (!account || (account.role !== "coach" && account.role !== "parent")) {
    return null;
  }

  if (resolveError) {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link
            to={backTarget}
            className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="page-title">Private chat</h1>
        </header>
        <div className="card text-sm text-slate-700 dark:text-slate-200">
          {resolveError}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-slide-up">
      <header className="pt-4 pb-3">
        <Link
          to={backTarget}
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-700 dark:to-slate-900 text-white flex items-center justify-center">
            <Lock size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              With {otherName || (otherRole === "coach" ? "coach" : "parent")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              About {athleteName} · {athleteName} can&apos;t see this
            </p>
          </div>
        </div>
      </header>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 pb-3 px-0.5"
      >
        {loading ? (
          <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
            Loading…
          </div>
        ) : messages.length === 0 ? (
          <EmptyState athleteName={athleteName} />
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              isMine={m.sender_account_id === account.id}
            />
          ))
        )}
      </div>

      {/* Compose */}
      <form
        onSubmit={submit}
        className="flex items-end gap-2 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 4000))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void submit(e as unknown as React.FormEvent);
            }
          }}
          rows={2}
          placeholder={`Message ${otherName || "them"}…`}
          className="flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm focus:border-brand-500 dark:focus:border-brand-400 outline-none resize-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label="Send message"
          className="w-11 h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:outline-none flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
      {sendErr && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
          {sendErr}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({
  msg,
  isMine,
}: {
  msg: AdultChatMessage;
  isMine: boolean;
}) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isMine
            ? "bg-brand-600 text-white rounded-br-md"
            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md"
        }`}
      >
        {!isMine && msg.sender_name && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
            {msg.sender_name}
          </div>
        )}
        <p className="whitespace-pre-wrap leading-snug">{msg.text}</p>
        <div
          className={`text-[10px] mt-1 ${
            isMine ? "text-brand-100" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {formatMessageTime(msg.created_at)}
          {isMine && msg.read_at ? " · read" : isMine ? " · sent" : ""}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ athleteName }: { athleteName: string }) {
  return (
    <div className="card text-center py-8">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
        <Lock size={20} />
      </div>
      <div className="font-bold text-slate-900 dark:text-slate-100 mt-3">
        Private and focused
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
        Talk about how to best support {athleteName}. Messages stay between
        the two of you — {athleteName} can&apos;t see this thread.
      </p>
    </div>
  );
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const wasYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return time;
  if (wasYesterday) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} · ${time}`;
}

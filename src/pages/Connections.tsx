import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import { supabase } from "../lib/supabase";
import { useRealtime } from "../lib/useRealtime";
import {
  ACCOUNT_ROLE_EMOJIS,
  ACCOUNT_ROLE_LABELS,
  type AccountRole,
  type ConnectionRequest,
  type ConnectionStatus,
} from "../types";
import {
  ArrowLeft,
  Users,
  Check,
  X,
  Clock,
  UserPlus,
  Mail,
  Send,
} from "lucide-react";

type ConnectionRow = ConnectionRequest & {
  athleteName: string;
  athleteEmail: string;
  otherName: string;
  otherEmail: string;
  otherRole: AccountRole;
};

export default function ConnectionsPage() {
  const { configured, account, user } = useAuth();
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);

    // Get all connections where I'm either the athlete or the other party
    const { data: rows, error } = await supabase
      .from("connections")
      .select("*")
      .or(`athlete_account_id.eq.${user.id},other_account_id.eq.${user.id}`);

    if (error || !rows) {
      setConnections([]);
      setLoading(false);
      return;
    }

    // Collect all account ids referenced
    const ids = new Set<string>();
    rows.forEach((r) => {
      ids.add(r.athlete_account_id);
      ids.add(r.other_account_id);
    });
    const { data: accts } = await supabase
      .from("accounts")
      .select("id, email, display_name, role")
      .in("id", [...ids]);
    const acctMap = new Map<string, { email: string; name: string; role: AccountRole }>();
    (accts ?? []).forEach((a) =>
      acctMap.set(a.id, { email: a.email, name: a.display_name, role: a.role })
    );

    const enriched: ConnectionRow[] = rows.map((r) => {
      const ath = acctMap.get(r.athlete_account_id);
      const oth = acctMap.get(r.other_account_id);
      return {
        id: r.id,
        athleteAccountId: r.athlete_account_id,
        otherAccountId: r.other_account_id,
        initiatedBy: r.initiated_by,
        connectedRole: r.connected_role,
        status: r.status,
        createdAt: r.created_at,
        respondedAt: r.responded_at ?? undefined,
        note: r.note ?? undefined,
        athleteName: ath?.name ?? "—",
        athleteEmail: ath?.email ?? "",
        otherName: oth?.name ?? "—",
        otherEmail: oth?.email ?? "",
        otherRole: oth?.role ?? "coach",
      };
    });

    setConnections(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Realtime — refresh the list whenever any connection involving me
  // changes (incoming invites, accepts, removals).
  useRealtime(
    {
      table: "connections",
      filter: user ? `athlete_account_id=eq.${user.id}` : undefined,
      enabled: Boolean(user),
    },
    fetchConnections
  );
  useRealtime(
    {
      table: "connections",
      filter: user ? `other_account_id=eq.${user.id}` : undefined,
      enabled: Boolean(user),
    },
    fetchConnections
  );

  async function respond(id: string, status: ConnectionStatus) {
    if (!supabase) return;
    setActionError(null);
    const { error } = await supabase
      .from("connections")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setActionError(`Couldn't update invite: ${error.message}`);
      return;
    }
    fetchConnections();
  }

  async function revoke(id: string) {
    if (!supabase) return;
    setActionError(null);
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", id);
    if (error) {
      setActionError(`Couldn't remove connection: ${error.message}`);
      return;
    }
    fetchConnections();
  }

  if (!configured || !account || !user) {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <h1 className="page-title">Connections</h1>
        </header>
        <div className="card">
          <p className="text-sm text-slate-700">
            Connections let athletes, coaches, and parents sync the same athlete
            profile — one team, three perspectives.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Cloud sync isn&apos;t configured yet. When it is, you&apos;ll be
            able to sign in and send connection invites here.
          </p>
        </div>
      </div>
    );
  }

  const pendingIncoming = connections.filter(
    (c) =>
      c.status === "pending" &&
      ((account.role !== "athlete" && c.otherAccountId === user.id) ||
        (account.role === "athlete" && c.athleteAccountId === user.id && c.initiatedBy !== "athlete"))
  );
  const pendingOutgoing = connections.filter(
    (c) =>
      c.status === "pending" && !pendingIncoming.includes(c)
  );
  const accepted = connections.filter((c) => c.status === "accepted");

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h1 className="page-title">Connections</h1>
              <p className="text-xs text-slate-500">
                Signed in as{" "}
                {ACCOUNT_ROLE_EMOJIS[account.role]} {account.displayName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1"
          >
            <UserPlus size={16} /> Invite
          </button>
        </div>
      </header>

      {showInvite && (
        <InviteForm
          myRole={account.role}
          myId={user.id}
          myDisplayName={account.displayName}
          onClose={() => setShowInvite(false)}
          onSent={(msg) => {
            setShowInvite(false);
            setNotice(msg);
            fetchConnections();
          }}
        />
      )}

      {notice && (
        <div className="card bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm">
          {notice}
          <button
            onClick={() => setNotice(null)}
            className="float-right text-emerald-700 dark:text-emerald-300 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {actionError && (
        <div className="card bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-sm">
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="float-right text-red-700 dark:text-red-300 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="card text-sm text-slate-500">Loading connections...</div>
      ) : (
        <>
          {pendingIncoming.length > 0 && (
            <Section label="Invites for you">
              {pendingIncoming.map((c) => (
                <IncomingCard
                  key={c.id}
                  row={c}
                  onAccept={() => respond(c.id, "accepted")}
                  onDecline={() => respond(c.id, "declined")}
                />
              ))}
            </Section>
          )}

          {accepted.length > 0 && (
            <Section label="Connected">
              {accepted.map((c) => (
                <AcceptedCard
                  key={c.id}
                  row={c}
                  meId={user.id}
                  onRevoke={() => revoke(c.id)}
                />
              ))}
            </Section>
          )}

          {pendingOutgoing.length > 0 && (
            <Section label="Pending invites you sent">
              {pendingOutgoing.map((c) => (
                <OutgoingCard key={c.id} row={c} onRevoke={() => revoke(c.id)} />
              ))}
            </Section>
          )}

          {connections.length === 0 && (
            <div className="card text-center py-10">
              <Users size={40} className="mx-auto text-slate-300" />
              <h3 className="font-bold mt-3 text-slate-900">No connections yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                Invite a coach or parent by email, or ask someone to invite you.
              </p>
              <button
                onClick={() => setShowInvite(true)}
                className="btn-primary mt-5"
              >
                <UserPlus size={16} className="inline mr-1" /> Send first invite
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Invite form
// -----------------------------------------------------------------------------
function InviteForm({
  myRole,
  myId,
  myDisplayName,
  onClose,
  onSent,
}: {
  myRole: AccountRole;
  myId: string;
  myDisplayName?: string;
  onClose: () => void;
  onSent: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState<AccountRole>(
    myRole === "athlete" ? "coach" : "athlete"
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // If I'm an athlete, I can invite coaches or parents (connected_role = coach|parent).
  // If I'm a coach or parent, I can only invite athletes (I'm the "other", athlete is the subject).
  const inviteOptions: AccountRole[] =
    myRole === "athlete" ? ["coach", "parent"] : ["athlete"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setSending(true);
    try {
      // 1. Look up the target account by email via the secure RPC
      // (direct table query is blocked by RLS — the RPC is the clean path)
      const { data: lookupData, error: lookupErr } = await supabase.rpc(
        "find_account_by_email",
        { lookup_email: email.trim() }
      );
      const acct = Array.isArray(lookupData)
        ? lookupData[0]
        : (lookupData as { id: string; role: string } | null);

      if (lookupErr || !acct) {
        setError(
          "No Fearless account found with that email. Ask them to sign up first."
        );
        setSending(false);
        return;
      }

      // 2. Determine athlete + other account ids based on roles
      let athleteId: string;
      let otherId: string;
      let connectedRole: AccountRole;

      if (myRole === "athlete") {
        athleteId = myId;
        otherId = acct.id;
        connectedRole = targetRole; // coach or parent
        if (acct.role !== targetRole) {
          setError(
            `That email belongs to a ${acct.role}, not a ${targetRole}.`
          );
          setSending(false);
          return;
        }
      } else {
        // I'm coach/parent inviting an athlete
        if (acct.role !== "athlete") {
          setError("That email doesn't belong to an athlete.");
          setSending(false);
          return;
        }
        athleteId = acct.id;
        otherId = myId;
        connectedRole = myRole; // coach or parent
      }

      if (athleteId === otherId) {
        setError("You can't connect with yourself.");
        setSending(false);
        return;
      }

      // 3. Insert the connection
      const newRow = {
        athlete_account_id: athleteId,
        other_account_id: otherId,
        initiated_by: myRole,
        connected_role: connectedRole,
        status: "pending",
        note: note.trim() || null,
      };
      let { error: insertErr } = await supabase
        .from("connections")
        .insert(newRow);

      if (insertErr?.code === "23505") {
        // Unique-constraint hit. Find out what's already there and either
        // clean it up (declined/revoked → delete and retry) or surface a
        // more specific message (pending/accepted → explain).
        const { data: existing } = await supabase
          .from("connections")
          .select("id, status")
          .eq("athlete_account_id", athleteId)
          .eq("other_account_id", otherId)
          .eq("connected_role", connectedRole)
          .maybeSingle();

        if (
          existing &&
          (existing.status === "declined" || existing.status === "revoked")
        ) {
          // Stale row — remove it and retry the invite.
          await supabase.from("connections").delete().eq("id", existing.id);
          const retry = await supabase.from("connections").insert(newRow);
          insertErr = retry.error ?? null;
        } else if (existing?.status === "pending") {
          setError(
            "An invite to this person is already pending — check the outgoing/incoming list."
          );
          setSending(false);
          return;
        } else if (existing?.status === "accepted") {
          setError("You're already connected with this person.");
          setSending(false);
          return;
        } else {
          setError(
            "A connection already exists in an unknown state — refresh and try again."
          );
          setSending(false);
          return;
        }
      }

      if (insertErr) {
        setError(insertErr.message);
        setSending(false);
        return;
      }

      // Notify the recipient with a push. Fire-and-forget — the invite
      // is already saved; push is best-effort.
      const recipientId = athleteId === myId ? otherId : athleteId;
      const inviterName = myDisplayName?.trim() || "Someone";
      const roleLabel =
        myRole === "coach"
          ? "coach"
          : myRole === "parent"
          ? "parent"
          : "athlete";
      try {
        supabase.functions
          .invoke("send-push", {
            body: {
              toAccountId: recipientId,
              title: `New Fearless invite`,
              body: `${inviterName} (${roleLabel}) wants to connect.${
                note.trim() ? ` "${note.trim().slice(0, 80)}"` : ""
              }`,
              url: "/connections",
              tag: `invite-${recipientId}`,
            },
          })
          .then(
            () => {},
            () => {}
          );
      } catch {
        /* best-effort */
      }

      onSent("Invite sent! They'll see it in their Connections tab.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 animate-pop-in">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-slate-900">New Invite</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </div>

      {myRole === "athlete" && (
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Invite as
          </label>
          <div className="grid grid-cols-2 gap-2">
            {inviteOptions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTargetRole(r)}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition ${
                  targetRole === r
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {ACCOUNT_ROLE_EMOJIS[r]} {ACCOUNT_ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Their Email
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
            placeholder="coach@email.com"
            className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-9 pr-3 py-2.5 text-sm focus:border-brand-500 dark:focus:border-brand-400 outline-none"
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          They must have a Fearless account with this email.
        </p>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Short message for them"
          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm focus:border-brand-500 dark:focus:border-brand-400 outline-none resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          disabled={sending || !email}
          className="btn-primary flex-1 disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <Send size={14} />
          {sending ? "Sending..." : "Send Invite"}
        </button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Section + card helpers
// -----------------------------------------------------------------------------
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="section-label mb-2 px-1">{label}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function IncomingCard({
  row,
  onAccept,
  onDecline,
}: {
  row: ConnectionRow;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="card bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900 border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{ACCOUNT_ROLE_EMOJIS[row.otherRole]}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-slate-100">{row.otherName}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{row.otherEmail}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Wants to connect as{" "}
            <span className="font-bold">
              {ACCOUNT_ROLE_LABELS[row.connectedRole].toLowerCase()}
            </span>
          </div>
          {row.note && (
            <div className="text-xs text-slate-700 italic mt-1.5 border-l-2 border-amber-300 pl-2">
              &ldquo;{row.note}&rdquo;
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={onDecline}
          className="py-2 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center gap-1"
        >
          <X size={14} strokeWidth={3} /> Decline
        </button>
        <button
          onClick={onAccept}
          className="py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm flex items-center justify-center gap-1"
        >
          <Check size={14} strokeWidth={3} /> Accept
        </button>
      </div>
    </div>
  );
}

function AcceptedCard({
  row,
  meId,
  onRevoke,
}: {
  row: ConnectionRow;
  meId: string;
  onRevoke: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const isMe = row.athleteAccountId === meId || row.otherAccountId === meId;
  const showOther = row.athleteAccountId === meId;
  const partnerName = showOther ? row.otherName : row.athleteName;
  const partnerEmail = showOther ? row.otherEmail : row.athleteEmail;
  const partnerRole = showOther ? row.connectedRole : "athlete";
  const iAmTheAthlete = row.athleteAccountId === meId;

  // Copy changes based on what removal means for the person clicking.
  const warning = iAmTheAthlete
    ? `${partnerName} will lose access to your profile, matches, videos, and notes. You can always send a new invite later.`
    : `You'll lose access to ${partnerName}'s data. They can send you a new invite if you want to reconnect.`;

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{ACCOUNT_ROLE_EMOJIS[partnerRole]}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">{partnerName}</div>
          <div className="text-xs text-slate-500 truncate">{partnerEmail}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
            <Check size={10} strokeWidth={3} /> Synced as{" "}
            {ACCOUNT_ROLE_LABELS[partnerRole]}
          </div>
        </div>
        {isMe && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-slate-400 hover:text-red-600 font-semibold"
          >
            Remove
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 space-y-2">
          <div className="text-xs text-red-900 font-semibold">
            Remove this connection?
          </div>
          <div className="text-xs text-red-800 leading-snug">{warning}</div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={onRevoke}
              className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              Yes, remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OutgoingCard({
  row,
  onRevoke,
}: {
  row: ConnectionRow;
  onRevoke: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <Clock size={20} className="text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 truncate">
            {row.initiatedBy === "athlete"
              ? row.otherName
              : row.athleteName}
          </div>
          <div className="text-xs text-slate-500">
            Awaiting their response ·{" "}
            {ACCOUNT_ROLE_LABELS[row.connectedRole].toLowerCase()}
          </div>
        </div>
        {!confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-slate-400 hover:text-red-600 font-semibold"
          >
            Cancel
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
          <div className="text-xs text-slate-700 leading-snug">
            Cancel this pending invite? You can always send another one.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold"
            >
              Keep waiting
            </button>
            <button
              onClick={onRevoke}
              className="flex-1 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold"
            >
              Cancel invite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

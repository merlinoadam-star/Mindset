import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";
import { opponentDisplayName } from "../lib/opponentStats";
import type { MatchEntry } from "../types";
import { Swords, Plus, ChevronRight, Check, Clock, Users, List, CalendarDays } from "lucide-react";
import MatchDetail from "../components/MatchDetail";
import MatchCalendar from "../components/MatchCalendar";

export default function MatchesPage() {
  const { state, addMatch } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [params, setParams] = useSearchParams();

  // Deep link: /matches?open=<matchId> from the season timeline.
  useEffect(() => {
    const openId = params.get("open");
    if (openId && state.matches.some((m) => m.id === openId)) {
      setActiveId(openId);
      // Clean the query string so going back to /matches doesn't keep
      // re-opening the same match.
      const next = new URLSearchParams(params);
      next.delete("open");
      setParams(next, { replace: true });
    }
  }, [params, setParams, state.matches]);

  if (!state.profile) return null;

  const matches = useMemo(
    () => [...state.matches].sort((a, b) => b.date.localeCompare(a.date)),
    [state.matches]
  );

  const activeMatch = activeId
    ? state.matches.find((m) => m.id === activeId) ?? null
    : null;

  if (activeMatch) {
    return <MatchDetail match={activeMatch} onBack={() => setActiveId(null)} />;
  }

  const wins = matches.filter((m) => m.result === "win").length;
  const losses = matches.filter((m) => m.result === "loss").length;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="page-title">Match Log</h1>
          <p className="page-subtitle">
            Prepare your mind, reflect after the battle.
          </p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1"
        >
          <Plus size={16} /> Match
        </button>
      </header>

      {matches.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="card !p-3 text-center">
              <div className="text-2xl font-extrabold tabular-nums text-slate-900">
                {matches.length}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Total</div>
            </div>
            <div className="card !p-3 text-center">
              <div className="text-2xl font-extrabold tabular-nums text-green-600">
                {wins}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Wins</div>
            </div>
            <div className="card !p-3 text-center">
              <div className="text-2xl font-extrabold tabular-nums text-red-500">
                {losses}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                Losses
              </div>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setView("list")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                view === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <List size={13} /> List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                view === "calendar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <CalendarDays size={13} /> Calendar
            </button>
          </div>
        </>
      )}

      {view === "calendar" && (
        <MatchCalendar
          matches={matches}
          onMatchClick={(id) => setActiveId(id)}
        />
      )}

      {newOpen && (
        <NewMatchForm
          onClose={() => setNewOpen(false)}
          onCreated={(id) => {
            setNewOpen(false);
            setActiveId(id);
          }}
        />
      )}

      {view === "list" && matches.length === 0 && !newOpen ? (
        <div className="card text-center py-10">
          <Swords size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold mt-3 text-slate-900">No matches yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            Log a match to get your head right before and learn from it
            after. You&apos;ve got this.
          </p>
          <button
            onClick={() => setNewOpen(true)}
            className="btn-primary mt-5"
          >
            <Plus size={16} className="inline mr-1" /> Log Your First Match
          </button>
        </div>
      ) : view === "list" ? (
        <div className="space-y-2">
          {matches.map((m) => (
            <MatchListItem key={m.id} match={m} onOpen={() => setActiveId(m.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );

  function NewMatchForm({
    onClose,
    onCreated,
  }: {
    onClose: () => void;
    onCreated: (id: string) => void;
  }) {
    const [date, setDate] = useState(todayISO());
    const [opponent, setOpponent] = useState("");
    const [opponentId, setOpponentId] = useState<string | undefined>();
    const [event, setEvent] = useState("");
    const [location, setLocation] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const opponentSuggestions = useMemo(() => {
      const q = opponent.trim().toLowerCase();
      if (!q) return state.opponents.slice(0, 6);
      return state.opponents
        .filter((o) => {
          const name = opponentDisplayName(o).toLowerCase();
          const team = (o.teamName ?? "").toLowerCase();
          return name.includes(q) || team.includes(q);
        })
        .slice(0, 8);
    }, [state.opponents, opponent]);

    function pickOpponent(id: string) {
      const opp = state.opponents.find((o) => o.id === id);
      if (!opp) return;
      setOpponentId(id);
      setOpponent(opponentDisplayName(opp));
      setShowSuggestions(false);
    }

    function submit(e: React.FormEvent) {
      e.preventDefault();
      const id = addMatch({
        date,
        opponent: opponent.trim() || undefined,
        opponentId,
        event: event.trim() || undefined,
        location: location.trim() || undefined,
      });
      onCreated(id);
    }

    return (
      <form onSubmit={submit} className="card space-y-4 animate-pop-in">
        <h2 className="font-bold text-slate-900">New Match</h2>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Match Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Opponent
          </label>
          <div className="relative">
            <input
              value={opponent}
              onChange={(e) => {
                setOpponent(e.target.value);
                setOpponentId(undefined); // breaks link if user types
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. John Smith / Lincoln HS"
              autoComplete="off"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 outline-none"
            />
            {opponentId && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <Users size={10} /> Linked
              </div>
            )}
          </div>
          {showSuggestions && opponentSuggestions.length > 0 && (
            <div className="mt-2 p-2 rounded-xl bg-white border border-slate-200 shadow-card max-h-48 overflow-y-auto">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 pb-1">
                Tracked opponents
              </div>
              <div className="flex flex-wrap gap-1">
                {opponentSuggestions.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickOpponent(o.id)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 flex items-center gap-1"
                  >
                    <Users size={10} />
                    {opponentDisplayName(o)}
                    {o.teamName && (
                      <span className="text-slate-400">· {o.teamName}</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 px-1">
                Or just type a name — you can track them later.
              </p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Event
            </label>
            <input
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="State Duals"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Home gym"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Create & Prepare
          </button>
        </div>
      </form>
    );
  }
}

function MatchListItem({
  match,
  onOpen,
}: {
  match: MatchEntry;
  onOpen: () => void;
}) {
  const prePrepared = !!match.preMatchCompletedAt;
  const postReflected = !!match.postMatchCompletedAt;

  const resultBadge = () => {
    if (match.result === "win") {
      return (
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-bold">
          W
        </span>
      );
    }
    if (match.result === "loss") {
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
          L
        </span>
      );
    }
    if (match.result === "tie") {
      return (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
          T
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
        Upcoming
      </span>
    );
  };

  return (
    <button
      onClick={onOpen}
      className="w-full card-interactive text-left flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {resultBadge()}
          <span className="text-sm font-bold text-slate-900 truncate">
            {match.opponent || "vs. Opponent"}
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {formatMatchDate(match.date)}
          {match.event ? ` · ${match.event}` : ""}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <StatusPill
            done={prePrepared}
            label="Pre-match"
          />
          <StatusPill
            done={postReflected}
            label="Reflection"
          />
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
    </button>
  );
}

function StatusPill({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
        done
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {done ? <Check size={10} strokeWidth={3} /> : <Clock size={10} />}
      {label}
    </span>
  );
}

function formatMatchDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (diff > 0 && diff < 7) return `In ${diff} days`;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

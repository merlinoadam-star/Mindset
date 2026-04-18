import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import {
  WRESTLING_WIN_TYPE_LABELS,
  type OpponentEntry,
} from "../types";
import {
  computeOpponentStats,
  matchesWithOpponent,
  opponentDisplayName,
  opponentMatchesQuery,
} from "../lib/opponentStats";
import MatchupTrendStrip from "../components/charts/MatchupTrendStrip";
import {
  ArrowLeft,
  Search,
  Plus,
  Users,
  Trophy,
  Pencil,
  Swords,
  Trash2,
  X,
  ChevronRight,
  MapPin,
  Shield,
  Calendar,
} from "lucide-react";

type SortKey = "most-faced" | "best-record" | "name";

export default function OpponentsPage() {
  const { state, addOpponent } = useStore();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sort, setSort] = useState<SortKey>("most-faced");

  if (!state.profile) return null;

  // Auto-suggest: names from matches that don't have an opponent record yet
  const unlinkedNames = useMemo(() => {
    const knownNames = new Set(
      state.opponents.map((o) => opponentDisplayName(o).toLowerCase())
    );
    const set = new Map<string, number>(); // name → match count
    for (const m of state.matches) {
      if (!m.opponent || m.opponentId) continue;
      const name = m.opponent.trim();
      if (!name || knownNames.has(name.toLowerCase())) continue;
      set.set(name, (set.get(name) ?? 0) + 1);
    }
    return [...set.entries()].sort((a, b) => b[1] - a[1]);
  }, [state.matches, state.opponents]);

  const filtered = useMemo(() => {
    const list = state.opponents.filter((o) =>
      opponentMatchesQuery(o, query)
    );
    const decorated = list.map((o) => ({
      o,
      stats: computeOpponentStats(state.matches, o),
    }));
    const sorted = [...decorated].sort((a, b) => {
      if (sort === "most-faced") {
        if (b.stats.totalMatches !== a.stats.totalMatches)
          return b.stats.totalMatches - a.stats.totalMatches;
      } else if (sort === "best-record") {
        const aPct =
          a.stats.totalMatches > 0
            ? a.stats.wins / a.stats.totalMatches
            : -1;
        const bPct =
          b.stats.totalMatches > 0
            ? b.stats.wins / b.stats.totalMatches
            : -1;
        if (bPct !== aPct) return bPct - aPct;
      }
      return opponentDisplayName(a.o).localeCompare(
        opponentDisplayName(b.o)
      );
    });
    return sorted;
  }, [state.opponents, state.matches, query, sort]);

  // Rivals — opponents you've faced 3+ times. Sort by total matches
  // (close call = more notable rivalry).
  const rivals = useMemo(() => {
    return filtered
      .filter((d) => d.stats.totalMatches >= 3)
      .slice(0, 4);
  }, [filtered]);

  if (activeId) {
    const opp = state.opponents.find((o) => o.id === activeId);
    if (opp) {
      return (
        <OpponentDetail
          opponent={opp}
          onBack={() => setActiveId(null)}
        />
      );
    }
  }

  function importFromMatches(name: string) {
    // Quick-create from existing match name — last name = last token, first = rest
    const parts = name.trim().split(/\s+/);
    const lastName = parts.length > 1 ? parts.slice(-1)[0] : parts[0];
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
    addOpponent({ firstName, lastName });
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h1 className="page-title">Opponent Tracker</h1>
              <p className="text-xs text-slate-500">
                {state.opponents.length} tracked ·{" "}
                {state.matches.filter((m) => m.opponent).length} matches
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, team, state, coach..."
          className="w-full rounded-xl border-2 border-slate-200 pl-9 pr-9 py-2.5 text-sm focus:border-brand-500 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showAdd && (
        <OpponentForm
          onCancel={() => setShowAdd(false)}
          onSaved={(id) => {
            setShowAdd(false);
            setActiveId(id);
          }}
        />
      )}

      {/* Unlinked names from matches */}
      {unlinkedNames.length > 0 && !showAdd && !query && (
        <div className="card bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900 border-amber-100 dark:border-amber-900">
          <div className="text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-300 font-bold mb-2">
            Opponents from your matches
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unlinkedNames.slice(0, 10).map(([name, count]) => (
              <button
                key={name}
                onClick={() => importFromMatches(name)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                <Plus size={10} className="inline mr-0.5" />
                {name}
                {count > 1 && (
                  <span className="ml-1 text-slate-400">({count})</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Tap to add any as a tracked opponent.
          </p>
        </div>
      )}

      {/* Rivals callout — opponents faced 3+ times */}
      {rivals.length > 0 && !query && (
        <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Swords size={14} className="text-indigo-700" />
            <h3 className="font-bold text-indigo-900 text-sm">
              Rivals ({rivals.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              faced 3+ times
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {rivals.map(({ o, stats }) => (
              <button
                key={o.id}
                onClick={() => setActiveId(o.id)}
                className="text-left p-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300"
              >
                <div className="font-bold text-slate-900 text-sm truncate">
                  {opponentDisplayName(o)}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <span
                    className={`font-bold tabular-nums ${
                      stats.wins > stats.losses
                        ? "text-emerald-700"
                        : stats.wins < stats.losses
                        ? "text-rose-700"
                        : "text-slate-700"
                    }`}
                  >
                    {stats.wins}-{stats.losses}
                  </span>
                  <span>·</span>
                  <span>{stats.totalMatches} matches</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort controls */}
      {state.opponents.length > 1 && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 font-semibold mr-1">Sort:</span>
          {(
            [
              ["most-faced", "Most faced"],
              ["best-record", "Best record"],
              ["name", "Name"],
            ] as Array<[SortKey, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-2.5 py-1 rounded-full font-semibold transition ${
                sort === key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 && !showAdd ? (
        <div className="card text-center py-10">
          <Users size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold mt-3 text-slate-900">
            {query ? "No matches" : "No opponents yet"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            {query
              ? "Try a different search term."
              : "Track the wrestlers and teams you face. See head-to-head records, strategy notes, and more."}
          </p>
          {!query && (
            <button
              onClick={() => setShowAdd(true)}
              className="btn-primary mt-5"
            >
              <Plus size={16} className="inline mr-1" /> Add First Opponent
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ o, stats }) => (
            <OpponentListItem
              key={o.id}
              opponent={o}
              matchCount={stats.totalMatches}
              wins={stats.wins}
              losses={stats.losses}
              onClick={() => setActiveId(o.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// List item
// -----------------------------------------------------------------------------
function OpponentListItem({
  opponent,
  matchCount,
  wins,
  losses,
  onClick,
}: {
  opponent: OpponentEntry;
  matchCount: number;
  wins: number;
  losses: number;
  onClick: () => void;
}) {
  const name = opponentDisplayName(opponent);
  const initial = (opponent.firstName?.[0] ?? opponent.lastName[0] ?? "?")
    .toUpperCase();
  return (
    <button
      onClick={onClick}
      className="w-full card-interactive text-left flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center text-lg font-extrabold flex-shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900 truncate">{name}</div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
          {opponent.teamName && (
            <span className="truncate">{opponent.teamName}</span>
          )}
          {opponent.state && (
            <>
              <span>·</span>
              <span>{opponent.state}</span>
            </>
          )}
          {opponent.weightClass && (
            <>
              <span>·</span>
              <span>{opponent.weightClass}</span>
            </>
          )}
          {opponent.position && (
            <>
              <span>·</span>
              <span>{opponent.position}</span>
            </>
          )}
        </div>
      </div>
      {matchCount > 0 && (
        <div className="text-right flex-shrink-0 mr-1">
          <div className="text-sm font-extrabold tabular-nums text-slate-900">
            {wins}-{losses}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            {matchCount} match{matchCount === 1 ? "" : "es"}
          </div>
        </div>
      )}
      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </button>
  );
}

// -----------------------------------------------------------------------------
// Detail
// -----------------------------------------------------------------------------
function OpponentDetail({
  opponent,
  onBack,
}: {
  opponent: OpponentEntry;
  onBack: () => void;
}) {
  const { state, deleteOpponent } = useStore();
  const stats = computeOpponentStats(state.matches, opponent);
  const matches = matchesWithOpponent(state.matches, opponent);
  const [editing, setEditing] = useState(false);

  const name = opponentDisplayName(opponent);
  const metaParts = [
    opponent.teamName,
    opponent.state,
    opponent.weightClass,
    opponent.position,
    opponent.grade && `Grade ${opponent.grade}`,
  ].filter(Boolean);

  function doDelete() {
    if (
      !confirm(
        "Delete this opponent? Existing match history stays but the link is removed."
      )
    )
      return;
    deleteOpponent(opponent.id);
    onBack();
  }

  if (editing) {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} /> Cancel
          </button>
          <h1 className="page-title">Edit Opponent</h1>
        </header>
        <OpponentForm
          existing={opponent}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> All Opponents
        </button>
      </header>

      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white p-5 shadow-elevated">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-3xl font-extrabold">
            {(opponent.firstName?.[0] ?? opponent.lastName[0] ?? "?").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{name}</h1>
            {metaParts.length > 0 && (
              <div className="text-sm text-white/80 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                {metaParts.map((p, i) => (
                  <span key={i}>{p}</span>
                ))}
              </div>
            )}
            {opponent.coachName && (
              <div className="text-xs text-white/60 mt-0.5 flex items-center gap-1">
                <Shield size={11} /> Coach {opponent.coachName}
              </div>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* Head-to-head */}
      {stats.totalMatches > 0 ? (
        <div className="card">
          <h2 className="font-bold text-slate-900 mb-3">Head-to-Head</h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatTile label="Wins" value={stats.wins} color="text-green-600" />
            <StatTile label="Losses" value={stats.losses} color="text-red-500" />
            <StatTile label="Total" value={stats.totalMatches} />
          </div>
          {(stats.pins > 0 || stats.techFalls > 0 || stats.majorDecisions > 0) && (
            <div className="grid grid-cols-3 gap-2">
              <StatTile
                label="Pins"
                value={stats.pins}
                small
                color={stats.pins > 0 ? "text-amber-600" : "text-slate-400"}
              />
              <StatTile
                label="Tech Falls"
                value={stats.techFalls}
                small
                color={stats.techFalls > 0 ? "text-amber-600" : "text-slate-400"}
              />
              <StatTile
                label="Majors"
                value={stats.majorDecisions}
                small
                color={stats.majorDecisions > 0 ? "text-amber-600" : "text-slate-400"}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="card text-sm text-slate-500 text-center py-6">
          No matches tracked against this opponent yet. Log a match and link
          to this opponent to see head-to-head stats.
        </div>
      )}

      {/* Matchup trend (Phase 4D.3) */}
      <MatchupTrendStrip matches={state.matches} opponent={opponent} />

      {/* Events in common */}
      {stats.events.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            Tournaments / Events in Common
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {stats.events.map((e) => (
              <span
                key={e}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strategy & notes */}
      {(opponent.strategyNotes || opponent.generalNotes) && (
        <div className="card space-y-3">
          {opponent.strategyNotes && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 mb-1">
                Strategy Notes
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {opponent.strategyNotes}
              </p>
            </div>
          )}
          {opponent.generalNotes && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Notes
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {opponent.generalNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Match history */}
      {matches.length > 0 && (
        <div>
          <h2 className="section-label mb-2 px-1">Match History</h2>
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="card !p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {m.result === "win" && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-bold">
                          W
                        </span>
                      )}
                      {m.result === "loss" && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
                          L
                        </span>
                      )}
                      {m.result === "tie" && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                          T
                        </span>
                      )}
                      {!m.result && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                          Pending
                        </span>
                      )}
                      <span className="text-sm font-semibold text-slate-700">
                        {new Date(m.date + "T00:00:00").toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    {m.event && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar size={10} /> {m.event}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    {m.wrestling?.myScore != null &&
                      m.wrestling?.theirScore != null && (
                        <div className="font-bold text-slate-900 tabular-nums">
                          {m.wrestling.myScore}-{m.wrestling.theirScore}
                        </div>
                      )}
                    {m.wrestling?.winType && (
                      <div className="text-slate-500 mt-0.5">
                        {WRESTLING_WIN_TYPE_LABELS[m.wrestling.winType]}
                      </div>
                    )}
                  </div>
                </div>
                {m.nextFocus && (
                  <div className="mt-2 text-xs text-slate-600 italic border-l-2 border-slate-200 pl-2">
                    {m.nextFocus}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={doDelete}
        className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 mx-auto pt-2"
      >
        <Trash2 size={12} /> Delete opponent
      </button>
    </div>
  );
}

function StatTile({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: number;
  color?: string;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-slate-50 border border-slate-200 text-center ${
        small ? "p-2" : "p-3"
      }`}
    >
      <div
        className={`${
          small ? "text-lg" : "text-2xl"
        } font-extrabold tabular-nums ${color ?? "text-slate-900"}`}
      >
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Add / Edit form
// -----------------------------------------------------------------------------
function OpponentForm({
  existing,
  onCancel,
  onSaved,
}: {
  existing?: OpponentEntry;
  onCancel: () => void;
  onSaved: (id: string) => void;
}) {
  const { state, addOpponent, updateOpponent } = useStore();
  const sport = state.profile!.sport;

  const [firstName, setFirstName] = useState(existing?.firstName ?? "");
  const [lastName, setLastName] = useState(existing?.lastName ?? "");
  const [teamName, setTeamName] = useState(existing?.teamName ?? "");
  const [stateName, setStateName] = useState(existing?.state ?? "");
  const [coachName, setCoachName] = useState(existing?.coachName ?? "");
  const [weightClass, setWeightClass] = useState(existing?.weightClass ?? "");
  const [position, setPosition] = useState(existing?.position ?? "");
  const [grade, setGrade] = useState(existing?.grade ?? "");
  const [jerseyNumber, setJerseyNumber] = useState(
    existing?.jerseyNumber ?? ""
  );
  const [strategyNotes, setStrategyNotes] = useState(
    existing?.strategyNotes ?? ""
  );
  const [generalNotes, setGeneralNotes] = useState(
    existing?.generalNotes ?? ""
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!lastName.trim()) return;
    const data = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim(),
      teamName: teamName.trim() || undefined,
      state: stateName.trim() || undefined,
      coachName: coachName.trim() || undefined,
      weightClass: weightClass.trim() || undefined,
      position: position.trim() || undefined,
      grade: grade.trim() || undefined,
      jerseyNumber: jerseyNumber.trim() || undefined,
      strategyNotes: strategyNotes.trim() || undefined,
      generalNotes: generalNotes.trim() || undefined,
    };
    if (existing) {
      updateOpponent(existing.id, data);
      onSaved(existing.id);
    } else {
      const id = addOpponent(data);
      onSaved(id);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 animate-pop-in">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-slate-900">
          {existing ? "Edit Opponent" : "New Opponent"}
        </h2>
        {!existing && (
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name">
          <input
            className={inputCls}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
        </Field>
        <Field label="Last Name *">
          <input
            className={inputCls}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            required
          />
        </Field>
      </div>

      <Field label="Team / School / Club">
        <input
          className={inputCls}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Lincoln HS / Iron Bears Club"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="State">
          <input
            className={inputCls}
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            placeholder="IA"
            maxLength={20}
          />
        </Field>
        <Field label="Grade">
          <input
            className={inputCls}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="10"
          />
        </Field>
      </div>

      <Field label="Coach">
        <input
          className={inputCls}
          value={coachName}
          onChange={(e) => setCoachName(e.target.value)}
          placeholder="Coach Rodriguez"
        />
      </Field>

      {sport === "wrestling" ? (
        <Field label="Weight Class">
          <input
            className={inputCls}
            value={weightClass}
            onChange={(e) => setWeightClass(e.target.value)}
            placeholder="132"
          />
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Position">
            <input
              className={inputCls}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Outside Hitter"
            />
          </Field>
          <Field label="Jersey #">
            <input
              className={inputCls}
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="7"
            />
          </Field>
        </div>
      )}

      <Field label="Strategy Notes">
        <textarea
          value={strategyNotes}
          onChange={(e) => setStrategyNotes(e.target.value)}
          rows={3}
          placeholder="Watch for his ankle pick. Weak on bottom — attack stand-up early."
          className={inputCls + " resize-none"}
        />
      </Field>

      <Field label="General Notes">
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          rows={2}
          placeholder="Good kid, respectful. Dad is a high school coach."
          className={inputCls + " resize-none"}
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!lastName.trim()}
          className="btn-primary flex-1 disabled:opacity-40"
        >
          {existing ? "Save Changes" : "Add Opponent"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 outline-none transition";

// Keep imports that might be used in the future referenced
void MapPin;

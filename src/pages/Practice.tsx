import { useState } from "react";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import { todayISO } from "../lib/gamification";
import { drillsForSport } from "../lib/drills";
import { Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

const WRESTLING_TYPES = [
  "Drilling",
  "Live Wrestling",
  "Conditioning",
  "Lifting",
  "Technique",
  "Tournament",
];
const VOLLEYBALL_TYPES = [
  "Practice",
  "Drilling",
  "Scrimmage",
  "Conditioning",
  "Lifting",
  "Tournament",
];

export default function PracticePage() {
  const { state, addPractice } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState("");
  const [selectedDrills, setSelectedDrills] = useState<string[]>([]);
  const [drillsExpanded, setDrillsExpanded] = useState(true);

  if (!state.profile) return null;

  const types =
    state.profile.sport === "wrestling" ? WRESTLING_TYPES : VOLLEYBALL_TYPES;
  const drillCategories = drillsForSport(state.profile.sport);

  function reset() {
    setType("");
    setDurationMin(60);
    setIntensity(3);
    setNotes("");
    setSelectedDrills([]);
    setShowForm(false);
  }

  function toggleDrill(drill: string) {
    setSelectedDrills((prev) =>
      prev.includes(drill) ? prev.filter((d) => d !== drill) : [...prev, drill]
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return;
    const { awardedXp, newlyUnlocked } = addPractice({
      date: todayISO(),
      durationMin,
      type,
      intensity,
      notes: notes.trim(),
      drills: selectedDrills.length > 0 ? selectedDrills : undefined,
    });
    showReward(awardedXp, newlyUnlocked);
    reset();
  }

  const recent = state.practices.slice(0, 20);

  return (
    <div className="space-y-4">
      <header className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Practice Log</h1>
          <p className="text-sm text-slate-600 mt-1">
            {state.practices.length} practice
            {state.practices.length === 1 ? "" : "s"} logged
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            + Log
          </button>
        )}
      </header>

      {showForm && (
        <form onSubmit={submit} className="card space-y-5 animate-pop-in">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Type of Practice
            </label>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition ${
                    type === t
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setDrillsExpanded((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-2"
            >
              <span>
                Drills Worked{" "}
                {selectedDrills.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 text-xs rounded-full bg-brand-600 text-white">
                    {selectedDrills.length}
                  </span>
                )}
              </span>
              {drillsExpanded ? (
                <ChevronUp size={18} className="text-slate-400" />
              ) : (
                <ChevronDown size={18} className="text-slate-400" />
              )}
            </button>
            {drillsExpanded && (
              <div className="space-y-3">
                {drillCategories.map((cat) => (
                  <div key={cat.id}>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                      {cat.name}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.drills.map((drill) => {
                        const selected = selectedDrills.includes(drill);
                        return (
                          <button
                            key={drill}
                            type="button"
                            onClick={() => toggleDrill(drill)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                              selected
                                ? "bg-brand-600 text-white border-brand-600"
                                : "bg-white text-slate-700 border-slate-200 hover:border-brand-300"
                            }`}
                          >
                            {drill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-500 pt-1">
                  Tap to toggle. Optional — pick as many as you worked on.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Duration: <span className="text-brand-700">{durationMin} min</span>
            </label>
            <input
              type="range"
              min={15}
              max={180}
              step={5}
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>15m</span>
              <span>3h</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Intensity
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setIntensity(n as 1 | 2 | 3 | 4 | 5)}
                  className={`py-2 rounded-xl font-bold border-2 transition ${
                    intensity === n
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Easy</span>
              <span>All-out</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="How did it go? Wins, struggles, something to work on…"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={reset} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!type}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              Save Practice
            </button>
          </div>
        </form>
      )}

      {recent.length === 0 && !showForm ? (
        <div className="card text-center py-10">
          <Dumbbell className="mx-auto text-slate-300" size={40} />
          <h3 className="font-bold mt-3">No practices logged yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Tap &quot;+ Log&quot; after your next practice.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((p) => (
            <div key={p.id} className="card !p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900">{p.type}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDate(p.date)} · {p.durationMin} min · Intensity{" "}
                    {p.intensity}/5
                  </div>
                </div>
                <span className="chip bg-brand-50 text-brand-700">
                  +{p.xpEarned} XP
                </span>
              </div>
              {p.drills && p.drills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.drills.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
              {p.notes && (
                <p className="text-sm text-slate-700 mt-2 border-l-2 border-slate-200 pl-3">
                  {p.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

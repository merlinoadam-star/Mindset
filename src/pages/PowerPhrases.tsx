import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import SpeakButton from "../components/SpeakButton";
import { ArrowLeft, Sword, Plus, Pin, PinOff, Trash2, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "I'm built for this.",
  "Short memory, big heart.",
  "I trust my training.",
  "Calm under fire.",
  "One play at a time.",
  "All I see is gold.",
  "I am relentless.",
  "I belong here.",
  "Let's go to work.",
  "Poise, power, focus.",
  "The grind doesn't lie.",
  "Every rep. Every day.",
  "Pressure is a privilege.",
  "Next play, next breath.",
  "I am the storm.",
  "Dominate the next 10 seconds.",
  "No wasted movement.",
  "Breathe. Reset. Attack.",
  "Earn it twice.",
  "I don't hope — I prepare.",
  "Feet first, heart next.",
  "Quiet mind, loud actions.",
  "The moment is mine.",
  "Finish what I start.",
  "Discomfort is my edge.",
  "Compete against yesterday.",
  "Stay in the fight.",
  "Whistle to whistle.",
  "Win the rep in front of me.",
  "Make them feel you.",
];

export default function PowerPhrasesPage() {
  const { state, addPowerPhrase, deletePowerPhrase, togglePinnedPhrase } =
    useStore();
  const [draft, setDraft] = useState("");

  function add(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { awardedXp, newlyUnlocked } = addPowerPhrase(trimmed);
    if (awardedXp > 0 || newlyUnlocked.length) {
      showReward(awardedXp, newlyUnlocked);
    }
    setDraft("");
  }

  const sorted = [...state.powerPhrases].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const pinned = state.powerPhrases.find((p) => p.isPinned);

  const unusedSuggestions = SUGGESTIONS.filter(
    (s) =>
      !state.powerPhrases.some(
        (p) => p.text.toLowerCase() === s.toLowerCase()
      )
  );

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Sword size={18} />
          </div>
          <h1 className="page-title">Power Phrases</h1>
        </div>
        <p className="page-subtitle">
          Your personal library of mantras. Pin one, repeat it, own it.
        </p>
      </header>

      {pinned && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 text-white p-5 shadow-elevated">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-300" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-200">
                  Your Current Mantra
                </span>
              </div>
              <SpeakButton text={pinned.text} size="sm" rate={0.9} />
            </div>
            <blockquote className="text-xl font-extrabold leading-tight">
              "{pinned.text}"
            </blockquote>
          </div>
        </div>
      )}

      {/* Add new */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Plus size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Create your own
          </span>
        </div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add(draft)}
            placeholder="Short, present-tense, true to you"
            className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-red-500 outline-none"
          />
          <button
            onClick={() => add(draft)}
            disabled={!draft.trim()}
            className="px-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-sm disabled:opacity-40"
          >
            Add
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          +10 XP per new phrase · First one auto-pins
        </p>
      </div>

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div className="card">
          <h2 className="section-label mb-2">Need inspiration?</h2>
          <div className="flex flex-wrap gap-1.5">
            {unusedSuggestions.slice(0, 10).map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Your library */}
      {sorted.length === 0 ? (
        <div className="card text-center py-10">
          <Sword size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold mt-3 text-slate-900">
            Your library is empty
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            Every great athlete has a short phrase they return to under
            pressure. Add your first one above.
          </p>
        </div>
      ) : (
        <section>
          <h2 className="section-label mb-2 px-1">Your Library</h2>
          <div className="space-y-2">
            {sorted.map((p) => (
              <div
                key={p.id}
                className={`card !p-4 flex items-center gap-2 ${
                  p.isPinned ? "border-red-200 bg-red-50/50" : ""
                }`}
              >
                <blockquote className="flex-1 text-sm font-bold text-slate-900 leading-snug">
                  "{p.text}"
                </blockquote>
                <SpeakButton text={p.text} size="sm" rate={0.9} />
                <button
                  onClick={() => togglePinnedPhrase(p.id)}
                  aria-label={p.isPinned ? "Unpin" : "Pin as current mantra"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                    p.isPinned
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {p.isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this phrase?")) deletePowerPhrase(p.id);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

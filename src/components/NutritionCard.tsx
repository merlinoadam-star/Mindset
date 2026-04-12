import { useState } from "react";
import { useStore } from "../lib/store";
import { showReward } from "./RewardToast";
import { todayISO } from "../lib/gamification";
import {
  Apple,
  Check,
  ChevronDown,
  ChevronUp,
  Droplet,
  Minus,
  Plus,
} from "lucide-react";

interface MealKey {
  key: "ateBreakfast" | "ateLunch" | "ateDinner" | "ateSnacks";
  label: string;
  emoji: string;
}

const MEALS: MealKey[] = [
  { key: "ateBreakfast", label: "Breakfast", emoji: "🥣" },
  { key: "ateLunch", label: "Lunch", emoji: "🥪" },
  { key: "ateDinner", label: "Dinner", emoji: "🍽️" },
  { key: "ateSnacks", label: "Snacks", emoji: "🍎" },
];

interface QualityKey {
  key: "hadProtein" | "hadFruitVeg" | "hadWholeGrains" | "hadHealthyFats";
  label: string;
  emoji: string;
  hint: string;
}

const QUALITY: QualityKey[] = [
  {
    key: "hadProtein",
    label: "Protein",
    emoji: "🍗",
    hint: "Chicken, eggs, beans, fish, yogurt",
  },
  {
    key: "hadFruitVeg",
    label: "Fruits & Veg",
    emoji: "🥦",
    hint: "Any color of fruit or vegetable",
  },
  {
    key: "hadWholeGrains",
    label: "Whole Grains",
    emoji: "🌾",
    hint: "Oatmeal, brown rice, whole wheat",
  },
  {
    key: "hadHealthyFats",
    label: "Healthy Fats",
    emoji: "🥑",
    hint: "Avocado, nuts, olive oil, salmon",
  },
];

export default function NutritionCard() {
  const { state, saveNutritionLog } = useStore();
  const today = todayISO();
  const existing = state.nutritionLogs.find((n) => n.date === today);

  const [open, setOpen] = useState(!existing);
  const [ateBreakfast, setAteBreakfast] = useState(existing?.ateBreakfast ?? false);
  const [ateLunch, setAteLunch] = useState(existing?.ateLunch ?? false);
  const [ateDinner, setAteDinner] = useState(existing?.ateDinner ?? false);
  const [ateSnacks, setAteSnacks] = useState(existing?.ateSnacks ?? false);
  const [hadProtein, setHadProtein] = useState(existing?.hadProtein ?? false);
  const [hadFruitVeg, setHadFruitVeg] = useState(existing?.hadFruitVeg ?? false);
  const [hadWholeGrains, setHadWholeGrains] = useState(
    existing?.hadWholeGrains ?? false
  );
  const [hadHealthyFats, setHadHealthyFats] = useState(
    existing?.hadHealthyFats ?? false
  );
  const [preWorkoutFuel, setPreWorkoutFuel] = useState(
    existing?.preWorkoutFuel ?? false
  );
  const [postWorkoutFuel, setPostWorkoutFuel] = useState(
    existing?.postWorkoutFuel ?? false
  );
  const [waterGlasses, setWaterGlasses] = useState(existing?.waterGlasses ?? 0);
  const [proudOf, setProudOf] = useState(existing?.proudOf ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const mealsMap = { ateBreakfast, ateLunch, ateDinner, ateSnacks };
  const mealsSetters = {
    ateBreakfast: setAteBreakfast,
    ateLunch: setAteLunch,
    ateDinner: setAteDinner,
    ateSnacks: setAteSnacks,
  };

  const qualityMap = {
    hadProtein,
    hadFruitVeg,
    hadWholeGrains,
    hadHealthyFats,
  };
  const qualitySetters = {
    hadProtein: setHadProtein,
    hadFruitVeg: setHadFruitVeg,
    hadWholeGrains: setHadWholeGrains,
    hadHealthyFats: setHadHealthyFats,
  };

  const qualityCount = Object.values(qualityMap).filter(Boolean).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const { awardedXp, newlyUnlocked } = saveNutritionLog({
      date: today,
      ateBreakfast,
      ateLunch,
      ateDinner,
      ateSnacks,
      hadProtein,
      hadFruitVeg,
      hadWholeGrains,
      hadHealthyFats,
      preWorkoutFuel,
      postWorkoutFuel,
      waterGlasses: waterGlasses || undefined,
      proudOf: proudOf.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (awardedXp > 0 || newlyUnlocked.length) {
      showReward(awardedXp, newlyUnlocked);
    }
    setOpen(false);
  }

  const done = !!existing;

  return (
    <div
      className={`card ${
        done ? "bg-gradient-to-br from-lime-50 to-white border-lime-100" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              done ? "bg-lime-500 text-white" : "bg-lime-100 text-lime-600"
            }`}
          >
            {done ? <Check size={18} strokeWidth={3} /> : <Apple size={18} />}
          </div>
          <div className="text-left">
            <div className="font-bold text-slate-900">Fuel Log</div>
            <div className="text-xs text-slate-500">
              {done ? summary(existing, waterGlasses) : "How did you fuel today?"}
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-5 animate-slide-up">
          {/* Meals */}
          <div>
            <Label>Meals eaten</Label>
            <div className="grid grid-cols-4 gap-2">
              {MEALS.map((m) => {
                const checked = mealsMap[m.key];
                return (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => mealsSetters[m.key](!checked)}
                    className={`py-2.5 rounded-xl border-2 transition text-center ${
                      checked
                        ? "border-lime-500 bg-lime-50 text-lime-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <div className="text-xl">{m.emoji}</div>
                    <div className="text-[10px] font-bold mt-0.5">
                      {m.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food quality */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Food groups I had
              </label>
              {qualityCount >= 3 && (
                <span className="text-[10px] font-bold text-lime-700 bg-lime-100 px-2 py-0.5 rounded-full">
                  +5 XP bonus!
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUALITY.map((q) => {
                const checked = qualityMap[q.key];
                return (
                  <button
                    type="button"
                    key={q.key}
                    onClick={() => qualitySetters[q.key](!checked)}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      checked
                        ? "border-lime-500 bg-lime-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{q.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-bold ${
                            checked ? "text-lime-800" : "text-slate-800"
                          }`}
                        >
                          {q.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {q.hint}
                        </div>
                      </div>
                      {checked && (
                        <Check size={14} className="text-lime-600" strokeWidth={3} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workout fueling */}
          <div>
            <Label>Workout fueling</Label>
            <p className="text-[11px] text-slate-500 mb-2">
              Eating 1-2 hours before and within 30 min after boosts performance
              & recovery.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreWorkoutFuel(!preWorkoutFuel)}
                className={`py-3 px-3 rounded-xl border-2 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  preWorkoutFuel
                    ? "border-orange-500 bg-orange-50 text-orange-800"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                <span>🍌</span> Pre-workout
              </button>
              <button
                type="button"
                onClick={() => setPostWorkoutFuel(!postWorkoutFuel)}
                className={`py-3 px-3 rounded-xl border-2 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  postWorkoutFuel
                    ? "border-orange-500 bg-orange-50 text-orange-800"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                <span>🥤</span> Post-workout
              </button>
            </div>
          </div>

          {/* Hydration */}
          <div>
            <Label>
              <Droplet size={12} className="inline mr-1" /> Water glasses
            </Label>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 border-2 border-sky-200 p-2">
              <button
                type="button"
                onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                className="w-11 h-11 rounded-xl bg-white border border-sky-200 text-sky-700 flex items-center justify-center hover:bg-sky-100"
              >
                <Minus size={18} />
              </button>
              <div className="flex-1 flex flex-col items-center">
                <div className="text-3xl font-extrabold tabular-nums text-sky-700">
                  {waterGlasses}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-sky-600 font-bold">
                  {waterGlasses >= 8 ? "Great job!" : `${8 - waterGlasses} to 8`}
                </div>
                {/* Visual glass indicators */}
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-4 rounded-sm transition ${
                        i < waterGlasses ? "bg-sky-500" : "bg-sky-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaterGlasses(Math.min(12, waterGlasses + 1))}
                className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* What I'm proud of */}
          <div>
            <Label>Proud of (optional)</Label>
            <input
              value={proudOf}
              onChange={(e) => setProudOf(e.target.value)}
              placeholder="Swapped soda for water · Homemade meal"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-lime-500 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="How did your fueling affect practice?"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-lime-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-lime-600 to-green-500 text-white font-bold text-sm transition active:scale-[0.97] shadow-md"
          >
            {done
              ? "Update Fuel Log"
              : `Save Fuel Log +${15 + (qualityCount >= 3 ? 5 : 0)} XP`}
          </button>

          <p className="text-[11px] text-slate-400 text-center italic">
            Fuel for performance, not perfection.
          </p>
        </form>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function summary(
  n: {
    ateBreakfast?: boolean;
    ateLunch?: boolean;
    ateDinner?: boolean;
    hadProtein?: boolean;
    hadFruitVeg?: boolean;
    hadWholeGrains?: boolean;
    hadHealthyFats?: boolean;
    waterGlasses?: number;
  },
  currentWater: number
): string {
  const mealsEaten = [n.ateBreakfast, n.ateLunch, n.ateDinner].filter(
    Boolean
  ).length;
  const qualityCount = [
    n.hadProtein,
    n.hadFruitVeg,
    n.hadWholeGrains,
    n.hadHealthyFats,
  ].filter(Boolean).length;
  const water = n.waterGlasses ?? currentWater ?? 0;
  const parts = [
    `${mealsEaten}/3 meals`,
    `${qualityCount}/4 groups`,
    `${water}💧`,
  ];
  return parts.join(" · ");
}

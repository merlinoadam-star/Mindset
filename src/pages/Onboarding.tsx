import { useState } from "react";
import { useStore } from "../lib/store";
import type { Sport } from "../types";

const GRADES = ["5", "6", "7", "8", "9", "10", "11", "12"];

export default function Onboarding() {
  const { setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<Sport | null>(null);
  const [age, setAge] = useState(12);
  const [grade, setGrade] = useState("7");

  function finish() {
    if (!name.trim() || !sport) return;
    setProfile({
      name: name.trim(),
      sport,
      age,
      grade,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white flex flex-col">
      <div className="max-w-xl w-full mx-auto px-6 py-10 flex-1 flex flex-col">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.3em] opacity-75">
            Mindset
          </div>
          <h1 className="text-3xl font-extrabold mt-1">
            Let&apos;s get you set up
          </h1>
          <p className="text-white/80 mt-2">
            A few quick questions to personalize your journey.
          </p>
        </div>

        <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
          {step === 0 && (
            <>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                What&apos;s your first name?
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(1)}
                placeholder="e.g. Alex"
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-brand-500 outline-none"
              />
              <div className="mt-auto pt-6">
                <button
                  disabled={!name.trim()}
                  onClick={() => setStep(1)}
                  className="btn-primary w-full disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Which sport?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSport("wrestling")}
                  className={`rounded-xl border-2 p-5 text-left transition ${
                    sport === "wrestling"
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-4xl mb-1">🤼</div>
                  <div className="font-bold">Wrestling</div>
                </button>
                <button
                  onClick={() => setSport("volleyball")}
                  className={`rounded-xl border-2 p-5 text-left transition ${
                    sport === "volleyball"
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-4xl mb-1">🏐</div>
                  <div className="font-bold">Volleyball</div>
                </button>
              </div>
              <div className="mt-auto pt-6 flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary">
                  Back
                </button>
                <button
                  disabled={!sport}
                  onClick={() => setStep(2)}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                How old are you?
              </label>
              <input
                type="number"
                min={8}
                max={19}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-brand-500 outline-none"
              />

              <label className="block text-sm font-semibold text-slate-700 mb-2 mt-5">
                What grade are you in?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`rounded-xl border-2 py-3 font-bold transition ${
                      grade === g
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-6 flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  Back
                </button>
                <button
                  onClick={finish}
                  className="btn-primary flex-1"
                >
                  Let&apos;s go! 🚀
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-10 rounded-full transition ${
                i <= step ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

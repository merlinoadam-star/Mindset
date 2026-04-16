import { useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/authContext";
import type { Sport } from "../types";
import {
  CheckSquare,
  Brain,
  Swords,
  Users,
  ChevronRight,
} from "lucide-react";

const GRADES = [
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

/**
 * Onboarding 2.0 — 5 screens:
 *   0. Welcome splash (what is this app?)
 *   1. First name
 *   2. Sport picker (with feature preview)
 *   3. Age + grade
 *   4. Success — "here's what to do first"
 */
export default function Onboarding() {
  const { setProfile } = useStore();
  const { configured } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<Sport | null>(null);
  const [age, setAge] = useState(10);
  const [grade, setGrade] = useState("5");
  const [done, setDone] = useState(false);

  function finish(): void {
    if (!name.trim() || !sport) return;
    setProfile({
      name: name.trim(),
      sport,
      age,
      grade,
      createdAt: new Date().toISOString(),
    });
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-700 text-white flex flex-col">
      <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute bottom-40 left-0 w-60 h-60 rounded-full bg-brand-400/10 blur-3xl" />

      <div className="relative max-w-xl w-full mx-auto px-6 py-10 flex-1 flex flex-col">
        {/* ============================================================= */}
        {/* Step 0 — Welcome splash                                        */}
        {/* ============================================================= */}
        {step === 0 && !done && (
          <div className="flex-1 flex flex-col justify-center text-center animate-slide-up">
            <div className="text-6xl mb-4">🔥</div>
            <div className="text-xs uppercase tracking-[0.3em] font-bold text-brand-300">
              Welcome to
            </div>
            <h1 className="text-5xl font-extrabold mt-1 tracking-tight">
              Mindset
            </h1>
            <p className="text-white/70 mt-4 text-base max-w-xs mx-auto leading-relaxed">
              The mental game app for youth athletes. Build habits, prep for
              matches, and grow stronger every day.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
              <FeatureChip icon="🎯" text="Daily habits & goals" />
              <FeatureChip icon="🧠" text="Mental prep for matches" />
              <FeatureChip icon="📈" text="Track your progress" />
              <FeatureChip icon="🏆" text="Earn XP & level up" />
            </div>

            <div className="mt-10 space-y-3">
              <button
                onClick={() => setStep(1)}
                className="btn-primary w-full !py-4 !text-base"
              >
                Get started
              </button>
              {configured && (
                <a
                  href="/auth"
                  className="block text-center text-sm text-white/60 hover:text-white/90 font-medium"
                >
                  Already have an account? Sign in
                </a>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* Step 1 — Name                                                   */}
        {/* ============================================================= */}
        {step === 1 && !done && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <StepHeader
              title="What's your first name?"
              subtitle="This is how your coach and teammates will see you."
            />
            <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-elevated flex-1 flex flex-col">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && name.trim() && setStep(2)
                }
                placeholder="e.g. Alex"
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-lg focus:border-brand-500 outline-none transition"
              />
              <div className="mt-auto pt-6 flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary">
                  Back
                </button>
                <button
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* Step 2 — Sport                                                  */}
        {/* ============================================================= */}
        {step === 2 && !done && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <StepHeader
              title="Which sport?"
              subtitle="We'll customize your habits, stats, and training tools."
            />
            <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-elevated flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSport("wrestling")}
                  className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                    sport === "wrestling"
                      ? "border-brand-500 bg-brand-50 shadow-glow-brand"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-4xl mb-2">🤼</div>
                  <div className="font-bold text-slate-900">Wrestling</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Folkstyle, Freestyle, Greco
                  </div>
                </button>
                <button
                  onClick={() => setSport("volleyball")}
                  className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                    sport === "volleyball"
                      ? "border-brand-500 bg-brand-50 shadow-glow-brand"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-4xl mb-2">🏐</div>
                  <div className="font-bold text-slate-900">Volleyball</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Indoor, Beach, Club
                  </div>
                </button>
              </div>

              {sport && (
                <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3 animate-slide-up">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-brand-700 mb-1.5">
                    Unlocked for {sport}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      {sport === "wrestling"
                        ? "Weight class tracking, pin combos, match scoring, opponent scouting"
                        : "Position stats, kill/dig/ace tracking, set scores, serve analysis"}
                    </div>
                    <div>
                      Plus sport-specific habits, visualizations, and mental
                      prep
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  Back
                </button>
                <button
                  disabled={!sport}
                  onClick={() => setStep(3)}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* Step 3 — Age & Grade                                            */}
        {/* ============================================================= */}
        {step === 3 && !done && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <StepHeader
              title="Almost there!"
              subtitle="Age and grade help us tailor content to you."
            />
            <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-elevated flex-1 flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                How old are you?
              </label>
              <input
                type="number"
                min={5}
                max={19}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-lg focus:border-brand-500 outline-none transition"
              />

              <label className="block text-sm font-bold text-slate-700 mb-2 mt-5">
                What grade are you in?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`rounded-xl border-2 py-3 font-bold transition-all duration-200 ${
                      grade === g
                        ? "border-brand-500 bg-brand-50 text-brand-700 shadow-glow-brand"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">K = Kindergarten</p>

              <div className="mt-auto pt-6 flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary">
                  Back
                </button>
                <button onClick={finish} className="btn-primary flex-1">
                  Let&apos;s go!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* Step 4 — Success / "What to do first"                           */}
        {/* ============================================================= */}
        {done && (
          <div className="flex-1 flex flex-col justify-center animate-slide-up">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🎉</div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                You&apos;re in, {name.trim()}!
              </h1>
              <p className="text-white/70 mt-2 text-sm max-w-xs mx-auto">
                Here are a few things to try first. You can always explore more
                from the menu.
              </p>
            </div>

            <div className="space-y-2">
              <FirstAction
                icon={<CheckSquare size={18} />}
                label="Check off today's habits"
                desc="Start your streak — just tap what you did today."
                href="/habits"
                color="from-emerald-500 to-green-600"
              />
              <FirstAction
                icon={<Brain size={18} />}
                label="Set today's goal"
                desc="One thing to focus on right now."
                href="/mindset"
                color="from-purple-500 to-brand-600"
              />
              <FirstAction
                icon={<Swords size={18} />}
                label="Log an upcoming match"
                desc="We'll help you prep mentally before and reflect after."
                href="/matches"
                color="from-amber-500 to-orange-600"
              />
              {configured && (
                <FirstAction
                  icon={<Users size={18} />}
                  label="Connect with your coach or parent"
                  desc="They can cheer you on and set weekly focus areas."
                  href="/auth"
                  color="from-sky-500 to-blue-600"
                />
              )}
            </div>

            <a
              href="/"
              className="mt-8 btn-primary w-full !py-4 !text-base text-center block"
            >
              Go to my dashboard
            </a>
          </div>
        )}

        {/* Step indicators — only during setup (steps 1-3) */}
        {step >= 1 && step <= 3 && !done && (
          <div className="mt-5 flex gap-2 justify-center">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-white w-10" : "bg-white/25 w-6"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="text-white/60 mt-1 text-sm">{subtitle}</p>
    </div>
  );
}

function FeatureChip({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5">
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-semibold text-white/90">{text}</span>
    </div>
  );
}

function FirstAction({
  icon,
  label,
  desc,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-white/10 hover:bg-white/15 p-3.5 transition"
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm">{label}</div>
        <div className="text-xs text-white/60 mt-0.5">{desc}</div>
      </div>
      <ChevronRight size={16} className="text-white/40 flex-shrink-0" />
    </a>
  );
}

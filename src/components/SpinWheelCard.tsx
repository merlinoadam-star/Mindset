import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";
import { pickSpin, SPIN_SLICES, type SpinSlice } from "../lib/spinWheel";
import { showReward } from "./RewardToast";
import { fireConfetti } from "./Confetti";
import { hapticCelebrate, hapticMedium } from "../lib/haptics";

/**
 * Phase G — Daily Spin the Wheel.
 *
 * Card on the dashboard offers one spin per day. Tapping it opens a
 * modal with an SVG wheel that animates to a weighted-random slice
 * and awards the reward.
 */
export default function SpinWheelCard() {
  const { state, claimDailySpin } = useStore();
  const today = todayISO();
  const claimed = state.lastSpinDate === today;
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{
    slice: SpinSlice;
    xpAwarded: number;
  } | null>(null);

  const spin = async () => {
    if (spinning || claimed) return;
    setSpinning(true);
    setResult(null);
    hapticMedium();

    const { index, rotationDeg, slice, mysteryXp } = pickSpin();
    // Add current rotation so the spin accumulates instead of resetting
    const finalRotation = rotation + rotationDeg;
    setRotation(finalRotation);

    // Wait for the CSS animation to finish (4s)
    window.setTimeout(() => {
      const { xpAwarded } = claimDailySpin(index, mysteryXp);
      setResult({ slice, xpAwarded });
      setSpinning(false);
      fireConfetti(60);
      hapticCelebrate();
      showReward(xpAwarded, [`__combo__${slice.label}`]);
    }, 4000);
  };

  if (!state.profile) return null;

  return (
    <>
      {!claimed && (
        <button
          onClick={() => setOpen(true)}
          className="w-full card bg-gradient-to-br from-fuchsia-100 via-pink-100 to-amber-100 dark:from-fuchsia-950 dark:via-pink-950 dark:to-amber-950 border-pink-200 dark:border-pink-800 text-left hover:shadow-card-hover transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-white flex items-center justify-center text-2xl animate-pulse">
              🎡
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold text-pink-700 dark:text-pink-400">
                Daily Spin Available!
              </div>
              <div className="font-extrabold text-slate-900 dark:text-white">
                Spin the wheel for a prize
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                XP, streak freezes, or the jackpot — only one per day.
              </div>
            </div>
          </div>
        </button>
      )}

      {open && (
        <SpinModal
          onClose={() => setOpen(false)}
          onSpin={spin}
          rotation={rotation}
          spinning={spinning}
          claimed={claimed}
          result={result}
        />
      )}
    </>
  );
}

function SpinModal({
  onClose,
  onSpin,
  rotation,
  spinning,
  claimed,
  result,
}: {
  onClose: () => void;
  onSpin: () => void;
  rotation: number;
  spinning: boolean;
  claimed: boolean;
  result: { slice: SpinSlice; xpAwarded: number } | null;
}) {
  const sliceAngle = 360 / SPIN_SLICES.length;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-elevated relative animate-pop-in">
        <button
          onClick={onClose}
          disabled={spinning}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center disabled:opacity-40"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-4">
          <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            🎡 Daily Spin
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            One spin per day — let&apos;s see what you get!
          </p>
        </div>

        {/* Wheel */}
        <div className="relative mx-auto w-64 h-64">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-slate-900 dark:border-t-white drop-shadow-md" />
          </div>

          {/* Wheel itself — animated */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-lg"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4s cubic-bezier(0.17, 0.67, 0.32, 1.0)"
                : "none",
            }}
          >
            {SPIN_SLICES.map((slice, i) => {
              const startAngle = i * sliceAngle - 90; // start at 12 o'clock
              const endAngle = startAngle + sliceAngle;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 50 + 50 * Math.cos(startRad);
              const y1 = 50 + 50 * Math.sin(startRad);
              const x2 = 50 + 50 * Math.cos(endRad);
              const y2 = 50 + 50 * Math.sin(endRad);
              const path = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 50 50 0 0 1 ${x2} ${y2}`,
                "Z",
              ].join(" ");
              const labelAngle = startAngle + sliceAngle / 2;
              const labelRad = (labelAngle * Math.PI) / 180;
              const labelR = 32;
              const lx = 50 + labelR * Math.cos(labelRad);
              const ly = 50 + labelR * Math.sin(labelRad);
              return (
                <g key={slice.id}>
                  <path d={path} fill={slice.color} stroke="#fff" strokeWidth={0.4} />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${labelAngle + 90} ${lx} ${ly})`}
                    fill="white"
                    fontSize="8"
                    fontWeight="800"
                    stroke="rgba(0,0,0,0.25)"
                    strokeWidth="0.2"
                  >
                    {slice.short}
                  </text>
                </g>
              );
            })}
            {/* Center hub */}
            <circle cx={50} cy={50} r={6} fill="#fff" stroke="#1e293b" strokeWidth={0.5} />
          </svg>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-4 text-center animate-slide-up">
            <div className="text-4xl mb-1">{result.slice.emoji}</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {result.slice.id === "mystery"
                ? `Mystery XP: +${result.xpAwarded}!`
                : result.slice.label}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Come back tomorrow for another spin.
            </div>
          </div>
        )}

        {/* Action button */}
        {!result && !claimed && (
          <button
            onClick={onSpin}
            disabled={spinning}
            className="btn-primary w-full mt-4 disabled:opacity-50"
          >
            {spinning ? "Spinning..." : "SPIN!"}
          </button>
        )}
        {claimed && !result && (
          <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            You&apos;ve already spun today. Come back tomorrow!
          </div>
        )}
        {result && (
          <button
            onClick={onClose}
            className="btn-secondary w-full mt-4"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useStore } from "../lib/store";
import { showReward } from "./RewardToast";
import { todayISO } from "../lib/gamification";
import type { Mood } from "../types";
import { Battery, Moon, Activity, ChevronDown, ChevronUp, Check } from "lucide-react";

export default function RecoveryCard() {
  const { state, saveRecoveryCheckin } = useStore();
  const today = todayISO();
  const existing = state.recoveryCheckins.find((r) => r.date === today);

  const [open, setOpen] = useState(!existing);
  const [sleepHours, setSleepHours] = useState(
    existing?.sleepHours?.toString() ?? ""
  );
  const [sleepQuality, setSleepQuality] = useState<Mood | undefined>(
    existing?.sleepQuality
  );
  const [soreness, setSoreness] = useState<Mood | undefined>(
    existing?.soreness
  );
  const [energy, setEnergy] = useState<Mood | undefined>(existing?.energy);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const { awardedXp, newlyUnlocked } = saveRecoveryCheckin({
      date: today,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      sleepQuality,
      soreness,
      energy,
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
        done
          ? "bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-slate-900 border-sky-100 dark:border-sky-800"
          : ""
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
              done
                ? "bg-sky-500 text-white"
                : "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300"
            }`}
          >
            {done ? (
              <Check size={18} strokeWidth={3} />
            ) : (
              <Battery size={18} />
            )}
          </div>
          <div className="text-left">
            <div className="font-bold text-slate-900 dark:text-slate-100">Recovery Check-In</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {done
                ? summarizeRecovery(existing, sleepHours)
                : "Sleep, soreness, energy — 30 seconds"}
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
        <form onSubmit={submit} className="mt-4 space-y-4 animate-slide-up">
          <div>
            <Label icon={<Moon size={12} />}>Hours slept</Label>
            <input
              type="number"
              step="0.5"
              min={0}
              max={14}
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g. 8"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-sky-500 outline-none"
            />
          </div>

          <ScaleRow
            icon={<Moon size={12} />}
            label="Sleep quality"
            labelLow="Terrible"
            labelHigh="Excellent"
            value={sleepQuality}
            onChange={setSleepQuality}
          />

          <ScaleRow
            icon={<Activity size={12} />}
            label="Soreness"
            labelLow="Fresh"
            labelHigh="Very sore"
            value={soreness}
            onChange={setSoreness}
            invert
          />

          <ScaleRow
            icon={<Battery size={12} />}
            label="Energy level"
            labelLow="Drained"
            labelHigh="Charged"
            value={energy}
            onChange={setEnergy}
          />

          <div>
            <Label>Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Felt sluggish in morning, better after warm-up."
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-sky-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 text-white font-bold text-sm transition active:scale-[0.97] shadow-md"
          >
            {done ? "Update Recovery Log" : "Save Recovery Log +15 XP"}
          </button>
        </form>
      )}
    </div>
  );
}

function Label({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {icon}
      {children}
    </label>
  );
}

function ScaleRow({
  icon,
  label,
  labelLow,
  labelHigh,
  value,
  onChange,
  invert = false,
}: {
  icon: React.ReactNode;
  label: string;
  labelLow: string;
  labelHigh: string;
  value: Mood | undefined;
  onChange: (v: Mood | undefined) => void;
  invert?: boolean;
}) {
  return (
    <div>
      <Label icon={icon}>{label}</Label>
      <div className="grid grid-cols-5 gap-1.5">
        {([1, 2, 3, 4, 5] as Mood[]).map((n) => {
          const selected = value === n;
          // For soreness we want the low end to be "good" (green), inverted.
          const colorIdx = invert ? 6 - n : n;
          const gradient = getScaleColor(colorIdx);
          return (
            <button
              type="button"
              key={n}
              onClick={() => onChange(selected ? undefined : n)}
              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition ${
                selected
                  ? `${gradient} text-white border-transparent shadow-sm`
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{labelLow}</span>
        <span>{labelHigh}</span>
      </div>
    </div>
  );
}

function getScaleColor(n: number): string {
  switch (n) {
    case 1:
      return "bg-gradient-to-br from-red-500 to-red-400";
    case 2:
      return "bg-gradient-to-br from-orange-500 to-orange-400";
    case 3:
      return "bg-gradient-to-br from-amber-500 to-yellow-400";
    case 4:
      return "bg-gradient-to-br from-lime-500 to-green-400";
    case 5:
    default:
      return "bg-gradient-to-br from-green-500 to-emerald-500";
  }
}

function summarizeRecovery(
  r: { sleepHours?: number; sleepQuality?: Mood; energy?: Mood; soreness?: Mood },
  currentSleep: string
): string {
  const parts: string[] = [];
  const sh = r.sleepHours ?? parseFloat(currentSleep);
  if (sh) parts.push(`${sh}h sleep`);
  if (r.energy) parts.push(`energy ${r.energy}/5`);
  if (r.soreness) parts.push(`soreness ${r.soreness}/5`);
  return parts.length ? parts.join(" · ") : "Logged — tap to edit";
}

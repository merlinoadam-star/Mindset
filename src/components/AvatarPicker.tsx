import { useEffect, useId, useState } from "react";
import { X, Check } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { hapticLight, hapticSuccess } from "../lib/haptics";

/**
 * Avatar picker modal — 40 fun emojis across sports, animals, and
 * characters. Also a "use initial" option to clear back to the
 * default.
 */

const EMOJI_GROUPS: Array<{ name: string; emojis: string[] }> = [
  {
    name: "Sports",
    emojis: ["🤼", "🏐", "🥇", "🏆", "💪", "🔥", "⚡", "🏅", "🎯", "🥊"],
  },
  {
    name: "Animals",
    emojis: ["🦁", "🐻", "🐯", "🦅", "🐺", "🦈", "🐆", "🦍", "🐲", "🦖"],
  },
  {
    name: "Fire",
    emojis: ["🚀", "⭐", "🌟", "💥", "⚔️", "🛡️", "👑", "🎖️", "💯", "🎲"],
  },
  {
    name: "Faces",
    emojis: ["😎", "🤠", "🥷", "🧙", "🦸", "🦹", "🤖", "👽", "🎃", "😤"],
  },
];

export default function AvatarPicker({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { account, updateAvatar } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, saving]);

  if (!open || !account) return null;

  const current = account.avatarEmoji ?? null;

  const pick = async (emoji: string | null) => {
    hapticLight();
    setSaving(true);
    setError(null);
    const { error: err } = await updateAvatar(emoji);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    hapticSuccess();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-elevated relative animate-pop-in max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={saving}
          aria-label="Close avatar picker"
          className="absolute top-3 right-3 w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-4">
          <div id={titleId} className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pick your avatar
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            This shows up everywhere your name does.
          </p>
        </div>

        {/* Use initial option */}
        <button
          onClick={() => pick(null)}
          disabled={saving}
          className={`w-full mb-4 p-3 rounded-xl border-2 flex items-center gap-3 transition ${
            current === null
              ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
              : "border-slate-200 dark:border-slate-700"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-extrabold">
            {account.displayName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 text-left">
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              Just my initial
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Classic and simple
            </div>
          </div>
          {current === null && (
            <Check size={18} className="text-brand-600" strokeWidth={3} />
          )}
        </button>

        {/* Emoji grid grouped by category */}
        {EMOJI_GROUPS.map((group) => (
          <div key={group.name} className="mb-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
              {group.name}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {group.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => pick(emoji)}
                  disabled={saving}
                  className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition disabled:opacity-50 ${
                    current === emoji
                      ? "bg-brand-500 ring-2 ring-brand-400 ring-offset-2 dark:ring-offset-slate-900 scale-105"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <div className="text-xs text-red-600 text-center mt-2">{error}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Shared avatar circle — shows the user's emoji if set, otherwise the
 * first letter of their display name with a gradient background.
 */
export function AvatarCircle({
  emoji,
  initial,
  size = 44,
  className = "",
}: {
  emoji?: string | null;
  initial?: string;
  size?: number;
  className?: string;
}) {
  const sizeClass =
    size >= 44
      ? "text-xl"
      : size >= 36
      ? "text-lg"
      : "text-base";
  const dim = { width: size, height: size };

  if (emoji) {
    return (
      <div
        style={dim}
        className={`rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-card ${className}`}
      >
        <span className={sizeClass}>{emoji}</span>
      </div>
    );
  }
  return (
    <div
      style={dim}
      className={`rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-extrabold shadow-card ${sizeClass} ${className}`}
    >
      {initial?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

import { Volume2, VolumeX, Pause } from "lucide-react";
import { useSpeech } from "../lib/useSpeech";
import { useStore } from "../lib/store";

interface Props {
  text: string;
  rate?: number; // speech rate override (0.1–10)
  label?: string; // optional text label next to icon
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Override the global persona for this specific button. */
  personaId?: string;
}

/**
 * Tap to read a block of text aloud using the athlete's selected voice
 * persona. Tap again to pause / stop. Hides itself automatically when
 * the browser doesn't support speech synthesis.
 */
export default function SpeakButton({
  text,
  rate,
  label,
  className = "",
  size = "md",
  personaId,
}: Props) {
  const { state } = useStore();
  const activePersonaId =
    personaId ?? state.voicePersonaId ?? "natural";
  const { supported, speaking, paused, speak, pause, resume, stop } =
    useSpeech(activePersonaId);

  if (!supported) return null;

  const sizeCls =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
      ? "w-12 h-12"
      : "w-10 h-10";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  function handleClick() {
    if (speaking && !paused) {
      pause();
    } else if (speaking && paused) {
      resume();
    } else {
      speak(text, { rate });
    }
  }

  const isPlaying = speaking && !paused;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isPlaying ? "Pause narration" : "Read aloud"}
      className={`inline-flex items-center gap-1.5 ${
        label ? "px-3 py-2 rounded-xl" : `rounded-full ${sizeCls} justify-center`
      } font-semibold transition ${
        isPlaying
          ? "bg-brand-600 text-white hover:bg-brand-700"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      } ${className}`}
    >
      {isPlaying ? (
        <Pause size={iconSize} strokeWidth={2.5} />
      ) : (
        <Volume2 size={iconSize} strokeWidth={2.5} />
      )}
      {label && <span className="text-xs">{isPlaying ? "Pause" : label}</span>}
      {isPlaying && label && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            stop();
          }}
          className="ml-1 opacity-70 hover:opacity-100"
        >
          <VolumeX size={12} />
        </span>
      )}
    </button>
  );
}

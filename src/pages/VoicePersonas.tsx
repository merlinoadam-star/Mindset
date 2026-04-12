import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useSpeech } from "../lib/useSpeech";
import { PERSONAS, type SpeechPersona } from "../lib/speechPersonas";
import { ArrowLeft, Check, Play, Mic2, Sparkles } from "lucide-react";

const PREVIEW_SAMPLES = [
  "Today, you give 100%. No half reps. No excuses.",
  "Champions are made when no one is watching.",
  "Trust your training. Trust your work. Trust yourself.",
  "The pain of discipline beats the pain of regret every time.",
  "Short memory. Big heart. Next play.",
];

export default function VoicePersonasPage() {
  const { state, setVoicePersona } = useStore();
  const { supported, speak, stop, speaking, activePersona } = useSpeech(
    state.voicePersonaId ?? "natural"
  );

  const currentId = state.voicePersonaId ?? "natural";

  function preview(p: SpeechPersona) {
    stop();
    const sample =
      PREVIEW_SAMPLES[Math.floor(Math.random() * PREVIEW_SAMPLES.length)];
    speak(sample, { persona: p });
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Settings
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center">
            <Mic2 size={18} />
          </div>
          <h1 className="page-title">Voice Personas</h1>
        </div>
        <p className="page-subtitle">
          Pick who reads things aloud to you.
        </p>
      </header>

      {!supported && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="text-sm text-amber-900 font-semibold">
            This browser doesn&apos;t support text-to-speech.
          </div>
          <p className="text-xs text-amber-800 mt-1">
            Try Chrome, Safari, or Edge on a desktop or phone to enable voice
            playback.
          </p>
        </div>
      )}

      <div className="card bg-gradient-to-br from-brand-50 to-purple-50 border-brand-100">
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-brand-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold">How it works:</span> each persona picks a
            voice on your device and layers on signature pace, pitch, and intro
            phrases. Tap{" "}
            <span className="inline-flex items-center gap-0.5 font-bold">
              <Play size={10} fill="currentColor" /> Preview
            </span>{" "}
            to hear any persona, and tap the card to make it your default.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {PERSONAS.map((p) => {
          const selected = currentId === p.id;
          const isPlayingThis = speaking && activePersona?.id === p.id;
          return (
            <div
              key={p.id}
              className={`card transition ${
                selected
                  ? "border-brand-500 bg-gradient-to-br from-brand-50 to-white shadow-glow-brand"
                  : "hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{p.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900">
                      {p.name}
                    </span>
                    {selected && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-700 bg-brand-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        <Check size={10} strokeWidth={3} /> Active
                      </span>
                    )}
                    {p.id === "random" && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Fun
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    {p.description}
                  </p>
                  {p.introPhrases && p.introPhrases.length > 0 && (
                    <div className="mt-1.5 text-[11px] text-slate-500 italic">
                      &ldquo;{p.introPhrases[0]}&rdquo;
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => preview(p)}
                    disabled={!supported}
                    className={`text-xs font-bold rounded-xl px-3 py-2 transition flex items-center gap-1 ${
                      isPlayingThis
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    } disabled:opacity-40`}
                  >
                    <Play size={12} fill="currentColor" />
                    {isPlayingThis ? "Playing" : "Preview"}
                  </button>
                  {!selected && (
                    <button
                      onClick={() => setVoicePersona(p.id)}
                      className="text-xs font-bold rounded-xl px-3 py-2 bg-brand-600 text-white hover:bg-brand-700 transition"
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card bg-slate-50 border-slate-200">
        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
          Note
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          These are character archetypes — not real celebrity voices. Actual
          licensed celebrity or cartoon voices would require a paid service
          like ElevenLabs. Want me to wire that up later? Just say the word.
        </p>
      </div>
    </div>
  );
}

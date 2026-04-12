import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildSpokenText,
  getPersona,
  pickVoiceForPersona,
  type SpeechPersona,
} from "./speechPersonas";

interface SpeakOptions {
  rate?: number; // 0.1–10 (default ~0.95)
  pitch?: number; // 0–2 (default 1)
  volume?: number; // 0–1
  voiceURI?: string;
  /** If provided, overrides the built-in persona selection for this call. */
  persona?: SpeechPersona | string;
  /** Turn off persona intro/outro phrases even when a persona is active. */
  plain?: boolean;
  onEnd?: () => void;
  onError?: () => void;
}

interface UseSpeechResult {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string, options?: SpeakOptions) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  /** Current active persona, or undefined if plain speech is being used. */
  activePersona?: SpeechPersona;
}

/**
 * Wraps the Web Speech API with optional character personas that adjust
 * voice, rate, pitch, and add themed intro/outro phrases. Pass
 * `persona` as a string id, a persona object, or omit to use the
 * caller's default (which usually comes from the store).
 */
export function useSpeech(defaultPersonaId?: string): UseSpeechResult {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [activePersona, setActivePersona] = useState<SpeechPersona | undefined>(
    defaultPersonaId ? getPersona(defaultPersonaId) : undefined
  );

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [supported]);

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!supported) {
        options.onError?.();
        return;
      }
      window.speechSynthesis.cancel();

      // Resolve persona: explicit option > default > natural
      let persona: SpeechPersona | undefined;
      if (options.persona) {
        persona =
          typeof options.persona === "string"
            ? getPersona(options.persona)
            : options.persona;
      } else if (defaultPersonaId) {
        persona = getPersona(defaultPersonaId);
      }
      setActivePersona(persona);

      const finalText =
        persona && !options.plain ? buildSpokenText(persona, text) : text;

      const utterance = new SpeechSynthesisUtterance(finalText);
      utterance.rate = options.rate ?? persona?.rate ?? 0.95;
      utterance.pitch = options.pitch ?? persona?.pitch ?? 1;
      utterance.volume = options.volume ?? 1;

      const allVoices = window.speechSynthesis.getVoices();
      let chosen: SpeechSynthesisVoice | undefined;
      if (options.voiceURI) {
        chosen = allVoices.find((v) => v.voiceURI === options.voiceURI);
      }
      if (!chosen && persona) {
        chosen = pickVoiceForPersona(persona, allVoices);
      }
      if (!chosen) {
        chosen =
          allVoices.find((v) =>
            /samantha|karen|moira|daniel|google us english|aaron|nicky/i.test(
              v.name
            )
          ) ||
          allVoices.find((v) => v.lang.startsWith("en-US") && v.default) ||
          allVoices.find((v) => v.lang.startsWith("en-US")) ||
          allVoices.find((v) => v.lang.startsWith("en")) ||
          allVoices[0];
      }
      if (chosen) utterance.voice = chosen;

      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
      };
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        options.onEnd?.();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
        options.onError?.();
      };
      utterance.onpause = () => setPaused(true);
      utterance.onresume = () => setPaused(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported, defaultPersonaId]
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [supported]);

  return {
    supported,
    speaking,
    paused,
    voices,
    speak,
    pause,
    resume,
    stop,
    activePersona,
  };
}

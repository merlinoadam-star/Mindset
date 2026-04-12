import { useCallback, useEffect, useRef, useState } from "react";

interface SpeakOptions {
  rate?: number; // 0.1–10 (default 1)
  pitch?: number; // 0–2 (default 1)
  volume?: number; // 0–1
  voiceURI?: string;
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
}

/**
 * Wraps the Web Speech API. Returns `supported: false` when the browser
 * doesn't expose speech synthesis (older Safari, some Android browsers
 * without the feature). All callers should check `supported` before
 * rendering controls.
 */
export function useSpeech(): UseSpeechResult {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices (browsers often populate them asynchronously)
  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [supported]);

  // Cleanup on unmount
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
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 0.95;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;

      // Try to pick a nice default English voice
      const allVoices = window.speechSynthesis.getVoices();
      let chosen: SpeechSynthesisVoice | undefined;
      if (options.voiceURI) {
        chosen = allVoices.find((v) => v.voiceURI === options.voiceURI);
      }
      if (!chosen) {
        // Prefer high-quality named voices if available
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
    [supported]
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

  return { supported, speaking, paused, voices, speak, pause, resume, stop };
}

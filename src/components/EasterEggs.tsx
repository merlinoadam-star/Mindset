import { useEffect, useRef, useState } from "react";
import { fireConfetti } from "./Confetti";
import { hapticCelebrate } from "../lib/haptics";

/**
 * Phase G — Easter eggs. Hidden interactions that reward curiosity.
 *
 * 1. Konami code (↑↑↓↓←→←→BA) → rainbow shimmer on all cards for 5s
 * 2. Shake phone → confetti burst
 * 3. Secret word "champion" typed anywhere → fireworks toast
 *
 * Mount this component once at the app root. It's invisible — just
 * listens for triggers.
 */

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const SECRET_WORDS: Record<string, { emoji: string; message: string }> = {
  champion: { emoji: "👑", message: "You ARE a champion!" },
  legend: { emoji: "🐐", message: "G.O.A.T. status unlocked!" },
  beast: { emoji: "💪", message: "BEAST MODE ACTIVATED!" },
  mindset: { emoji: "🧠", message: "That's the name of the game!" },
};

export default function EasterEggs() {
  const konamiIdx = useRef(0);
  const wordBuffer = useRef("");
  const [rainbow, setRainbow] = useState(false);

  // Konami code listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Konami code check
      if (e.key === KONAMI[konamiIdx.current]) {
        konamiIdx.current++;
        if (konamiIdx.current === KONAMI.length) {
          konamiIdx.current = 0;
          activateRainbow();
        }
      } else {
        konamiIdx.current = 0;
      }

      // Secret word check (only letters)
      if (/^[a-zA-Z]$/.test(e.key)) {
        wordBuffer.current += e.key.toLowerCase();
        if (wordBuffer.current.length > 20) {
          wordBuffer.current = wordBuffer.current.slice(-20);
        }
        for (const [word, reward] of Object.entries(SECRET_WORDS)) {
          if (wordBuffer.current.endsWith(word)) {
            secretWordFound(reward.emoji, reward.message);
            wordBuffer.current = "";
            break;
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Shake detection (mobile)
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let shakeCount = 0;
    let lastShakeTime = 0;

    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;

      const deltaX = Math.abs(a.x - lastX);
      const deltaY = Math.abs(a.y - lastY);
      const deltaZ = Math.abs(a.z - lastZ);
      lastX = a.x;
      lastY = a.y;
      lastZ = a.z;

      if (deltaX + deltaY + deltaZ > 30) {
        const now = Date.now();
        if (now - lastShakeTime > 300) {
          shakeCount++;
          lastShakeTime = now;
          if (shakeCount >= 3) {
            shakeCount = 0;
            fireConfetti(100);
            hapticCelebrate();
          }
        }
      }
    };

    // Need to request permission on iOS 13+
    const initShake = async () => {
      const dme = DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (dme.requestPermission) {
        try {
          const perm = await dme.requestPermission();
          if (perm !== "granted") return;
        } catch {
          return;
        }
      }
      window.addEventListener("devicemotion", handler);
    };

    initShake();
    return () => window.removeEventListener("devicemotion", handler);
  }, []);

  const activateRainbow = () => {
    fireConfetti(150);
    hapticCelebrate();
    setRainbow(true);
    window.setTimeout(() => setRainbow(false), 5000);
  };

  const secretWordFound = (emoji: string, message: string) => {
    fireConfetti(80);
    hapticCelebrate();
    // Show a floating message
    const div = document.createElement("div");
    div.className =
      "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] text-center animate-pop-in pointer-events-none";
    div.innerHTML = `
      <div class="text-8xl mb-4">${emoji}</div>
      <div class="text-3xl font-extrabold text-white drop-shadow-lg">${message}</div>
    `;
    document.body.appendChild(div);
    window.setTimeout(() => div.remove(), 2500);
  };

  return (
    <>
      {rainbow && (
        <style>
          {`
            @keyframes rainbowShimmer {
              0% { filter: hue-rotate(0deg); }
              100% { filter: hue-rotate(360deg); }
            }
            .card, .btn-primary {
              animation: rainbowShimmer 2s linear infinite !important;
            }
          `}
        </style>
      )}
    </>
  );
}

/**
 * Tap-counter hook — call `onTap()` on each tap/click. When it hits
 * N taps within the timeout window, the callback fires.
 */
export function useTapEasterEgg(
  threshold = 5,
  windowMs = 2000
): { onTap: () => void } {
  const count = useRef(0);
  const timer = useRef<number | null>(null);

  const onTap = () => {
    count.current++;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      count.current = 0;
    }, windowMs);

    if (count.current >= threshold) {
      count.current = 0;
      fireConfetti(120);
      hapticCelebrate();
      // Show "BEAST MODE" message
      const div = document.createElement("div");
      div.className =
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] text-center animate-pop-in pointer-events-none";
      div.innerHTML = `
        <div class="text-8xl mb-4">🔥</div>
        <div class="text-4xl font-extrabold text-white drop-shadow-lg">BEAST MODE</div>
      `;
      document.body.appendChild(div);
      window.setTimeout(() => div.remove(), 2500);
    }
  };

  return { onTap };
}

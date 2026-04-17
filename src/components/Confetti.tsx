import { useEffect, useMemo, useState } from "react";

/**
 * Lightweight confetti burst — pure CSS animation, no library. Spawns
 * N colored pieces with random trajectories, rotations, and fall times,
 * then auto-cleans up. Fire it on level-ups, streak milestones, etc.
 */

interface Piece {
  id: number;
  left: number; // viewport %
  color: string;
  delay: number; // ms
  duration: number; // ms
  rotate: number; // final rotation in deg
  drift: number; // horizontal drift in px
  shape: "square" | "circle" | "line";
}

const COLORS = [
  "#6366f1", // brand
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
];

let nextBurstId = 1;
let trigger: ((count: number) => void) | null = null;

/** Fire confetti from outside the component tree. */
export function fireConfetti(count = 60): void {
  if (trigger) trigger(count);
}

export default function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    trigger = (count) => {
      const burstId = nextBurstId++;
      const newPieces: Piece[] = Array.from({ length: count }, (_, i) => ({
        id: burstId * 1000 + i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 200,
        duration: 2500 + Math.random() * 1500,
        rotate: (Math.random() - 0.5) * 720,
        drift: (Math.random() - 0.5) * 200,
        shape:
          Math.random() < 0.5
            ? "square"
            : Math.random() < 0.7
            ? "circle"
            : "line",
      }));
      setPieces((prev) => [...prev, ...newPieces]);
      // Clean up after animation
      window.setTimeout(() => {
        setPieces((prev) => prev.filter((p) => !newPieces.some((n) => n.id === p.id)));
      }, 4500);
    };
    return () => {
      trigger = null;
    };
  }, []);

  const style = useMemo(
    () => `
      @keyframes confettiFall {
        0% {
          transform: translate3d(0, -10vh, 0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translate3d(var(--drift), 110vh, 0) rotate(var(--rot));
          opacity: 0;
        }
      }
    `,
    []
  );

  if (pieces.length === 0) return null;

  return (
    <>
      <style>{style}</style>
      <div className="fixed inset-0 pointer-events-none z-[70] overflow-hidden">
        {pieces.map((p) => {
          const shapeClass =
            p.shape === "circle"
              ? "rounded-full w-2 h-2"
              : p.shape === "line"
              ? "w-1 h-3"
              : "w-2 h-2";
          return (
            <span
              key={p.id}
              className={`absolute top-0 ${shapeClass}`}
              style={
                {
                  left: `${p.left}%`,
                  backgroundColor: p.color,
                  animation: `confettiFall ${p.duration}ms ${p.delay}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                  "--drift": `${p.drift}px`,
                  "--rot": `${p.rotate}deg`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
    </>
  );
}

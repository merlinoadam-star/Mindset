import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Gamepad2,
  Grid3x3,
  Target,
  Zap,
} from "lucide-react";

interface GameDef {
  id: string;
  to: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string; // "from-x to-y"
  badgeColor: string; // text color for XP
  xpInfo: string;
  bestLabel?: string; // how the best score should be labeled
}

const GAMES: GameDef[] = [
  {
    id: "trivia",
    to: "/trivia",
    title: "Sport Trivia",
    subtitle: "Knowledge check on rules, legends, and history",
    icon: <Gamepad2 size={20} />,
    gradient: "from-amber-400 to-orange-500",
    badgeColor: "text-amber-700",
    xpInfo: "+10 XP per correct · +15 perfect round",
  },
  {
    id: "scenarios",
    to: "/scenarios",
    title: "Decision Drill",
    subtitle: "What would a champion do in this situation?",
    icon: <Brain size={20} />,
    gradient: "from-indigo-500 to-purple-600",
    badgeColor: "text-indigo-700",
    xpInfo: "+15 XP per correct · +20 perfect round",
  },
  {
    id: "reaction",
    to: "/games/reaction",
    title: "Reaction Tap",
    subtitle: "Tap the green, avoid the red — train your reflexes",
    icon: <Zap size={20} />,
    gradient: "from-green-500 to-emerald-600",
    badgeColor: "text-green-700",
    xpInfo: "+1 XP per hit · bonus for high scores",
    bestLabel: "Best score",
  },
  {
    id: "flash",
    to: "/games/flash",
    title: "Focus Flash",
    subtitle: "Memorize the sequence — train your working memory",
    icon: <Grid3x3 size={20} />,
    gradient: "from-sky-500 to-blue-600",
    badgeColor: "text-sky-700",
    xpInfo: "+5 XP per level reached",
    bestLabel: "Best level",
  },
];

export default function GamesPage() {
  const { state } = useStore();
  if (!state.profile) return null;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
            <Target size={18} />
          </div>
          <h1 className="page-title">Mini-Games</h1>
        </div>
        <p className="page-subtitle">
          Play, earn XP, sharpen your edge.
        </p>
      </header>

      {/* Combined stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          label="Plays"
          value={state.triviaRoundsPlayed + countGamePlays(state.gameXpEarned ?? {})}
        />
        <StatTile
          label="Game XP"
          value={
            state.triviaXpEarned +
            Object.values(state.gameXpEarned ?? {}).reduce(
              (a, b) => a + b,
              0
            )
          }
        />
        <StatTile
          label="Bests"
          value={Object.keys(state.gameBestScores ?? {}).length}
        />
      </div>

      {/* Game list */}
      <div className="space-y-3">
        {GAMES.map((g) => {
          const best = state.gameBestScores?.[g.id];
          const trivia = g.id === "trivia" ? state.triviaRoundsPlayed : undefined;
          return (
            <Link
              key={g.id}
              to={g.to}
              className="block card-interactive text-left flex items-center gap-3"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${g.gradient} text-white flex items-center justify-center shadow-sm`}
              >
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">{g.title}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  {g.subtitle}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[11px] font-bold ${g.badgeColor}`}>
                    {g.xpInfo}
                  </span>
                  {best != null && (
                    <span className="text-[10px] font-bold text-white bg-slate-700 px-2 py-0.5 rounded-full">
                      {g.bestLabel ?? "Best"}: {best}
                    </span>
                  )}
                  {trivia != null && trivia > 0 && (
                    <span className="text-[10px] font-bold text-white bg-slate-700 px-2 py-0.5 rounded-full">
                      {trivia} rounds
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="card !p-3 text-center">
      <div className="text-2xl font-extrabold tabular-nums text-slate-900">
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
    </div>
  );
}

function countGamePlays(map: Record<string, number>): number {
  // Each 10 XP earned ≈ a play, rough heuristic to show play count
  return Object.values(map).reduce((a, b) => a + b, 0) > 0
    ? Object.keys(map).length
    : 0;
}

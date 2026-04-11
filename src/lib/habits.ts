import type { HabitDefinition, Sport } from "../types";

export const HABITS: HabitDefinition[] = [
  // Universal physical / recovery
  {
    id: "hydration",
    label: "Hydration",
    description: "Drink at least 8 glasses of water",
    emoji: "💧",
    xp: 10,
    sports: "all",
    category: "physical",
  },
  {
    id: "sleep",
    label: "8+ Hours Sleep",
    description: "Got a full night of recovery",
    emoji: "😴",
    xp: 15,
    sports: "all",
    category: "recovery",
  },
  {
    id: "stretching",
    label: "Stretching / Mobility",
    description: "10+ minutes of stretching",
    emoji: "🧘",
    xp: 10,
    sports: "all",
    category: "recovery",
  },
  {
    id: "nutrition",
    label: "Fueled Up",
    description: "Ate 3 balanced meals with protein",
    emoji: "🥗",
    xp: 10,
    sports: "all",
    category: "physical",
  },
  {
    id: "visualization",
    label: "Visualization",
    description: "5 minutes mentally rehearsing your sport",
    emoji: "🧠",
    xp: 15,
    sports: "all",
    category: "mental",
  },
  {
    id: "no-phone-morning",
    label: "Phone-Free Morning",
    description: "No phone for the first 30 min of your day",
    emoji: "📵",
    xp: 10,
    sports: "all",
    category: "mental",
  },

  // Wrestling-specific
  {
    id: "wrestling-drilling",
    label: "Drilling Session",
    description: "Drilled technique for 20+ minutes",
    emoji: "🤼",
    xp: 20,
    sports: ["wrestling"],
    category: "skill",
  },
  {
    id: "wrestling-conditioning",
    label: "Conditioning",
    description: "Sprints, burpees, or bodyweight circuit",
    emoji: "🏃",
    xp: 20,
    sports: ["wrestling"],
    category: "physical",
  },
  {
    id: "wrestling-weight",
    label: "Weight Check",
    description: "Weighed in and logged your number",
    emoji: "⚖️",
    xp: 5,
    sports: ["wrestling"],
    category: "physical",
  },

  // Volleyball-specific
  {
    id: "volleyball-serves",
    label: "Serving Practice",
    description: "50+ serves against a wall or net",
    emoji: "🏐",
    xp: 20,
    sports: ["volleyball"],
    category: "skill",
  },
  {
    id: "volleyball-passing",
    label: "Passing Drills",
    description: "100+ passes / reps",
    emoji: "🙌",
    xp: 20,
    sports: ["volleyball"],
    category: "skill",
  },
  {
    id: "volleyball-jumping",
    label: "Jump Training",
    description: "Box jumps or vertical work",
    emoji: "⬆️",
    xp: 20,
    sports: ["volleyball"],
    category: "physical",
  },
];

export function habitsForSport(sport: Sport): HabitDefinition[] {
  return HABITS.filter(
    (h) => h.sports === "all" || h.sports.includes(sport)
  );
}

export function getHabit(id: string): HabitDefinition | undefined {
  return HABITS.find((h) => h.id === id);
}

import type { Sport } from "../types";

export interface DrillCategory {
  id: string;
  name: string;
  drills: string[];
}

export const WRESTLING_DRILLS: DrillCategory[] = [
  {
    id: "stance-motion",
    name: "Stance & Motion",
    drills: [
      "Stance & Motion",
      "Circle Drill",
      "Hand Fighting",
      "Pummeling",
      "Tie-Up Practice",
      "Penetration Step",
    ],
  },
  {
    id: "takedowns",
    name: "Takedowns",
    drills: [
      "Single Leg",
      "Double Leg",
      "High Crotch",
      "Ankle Pick",
      "Snap Down",
      "Duck Under",
      "Fireman's Carry",
      "Arm Drag",
      "Head & Arm Throw",
      "Foot Sweep",
    ],
  },
  {
    id: "defense",
    name: "Defense",
    drills: [
      "Sprawl Drill",
      "Solo Sprawl",
      "Shot Defense (Whizzer)",
      "Front Headlock",
      "Down Block",
      "Reshot / Counter",
    ],
  },
  {
    id: "top",
    name: "Top Position",
    drills: [
      "Tight Waist & Ankle",
      "Spiral Ride",
      "Half Nelson",
      "Chicken Wing",
      "Cradle",
      "Bar Arm",
      "Turk",
      "Mat Return",
    ],
  },
  {
    id: "bottom",
    name: "Bottom Position",
    drills: [
      "Stand-Up",
      "Sit-Out Turn-In",
      "Sit-Out Turn-Out",
      "Switch",
      "Granby Roll",
      "Hip Heist",
      "Peterson Roll",
    ],
  },
  {
    id: "conditioning",
    name: "Conditioning & Body",
    drills: [
      "Bridging / Neck",
      "Partner Carries",
      "Spin Drill",
      "Airplane Drill",
      "Shots for Time",
      "Sprints",
      "Buddy Lifts",
    ],
  },
];

export const VOLLEYBALL_DRILLS: DrillCategory[] = [
  {
    id: "ball-control",
    name: "Ball Control",
    drills: [
      "Pepper",
      "Wall Passing",
      "Ball Handling",
      "Solo Passing Triangle",
      "Bump-Set-Bump",
    ],
  },
  {
    id: "passing",
    name: "Passing & Serve Receive",
    drills: [
      "Forearm Passing",
      "Butterfly Drill",
      "Serve Receive",
      "Shuffle Pass",
      "Dig Drill (coach hits)",
      "Over-the-Shoulder Pass",
    ],
  },
  {
    id: "setting",
    name: "Setting",
    drills: [
      "Setter Footwork",
      "Wall Setting",
      "Setting to Target",
      "Jump Setting",
      "Setter Transition",
      "Quick Sets",
    ],
  },
  {
    id: "hitting",
    name: "Hitting & Attacking",
    drills: [
      "Approach Footwork (3-step)",
      "Approach Footwork (4-step)",
      "Wall Hitting",
      "Hitting Lines",
      "Tip / Roll Shot",
      "Line vs. Cross Shot",
      "Slide Attack",
      "Back Row Attack",
    ],
  },
  {
    id: "serving",
    name: "Serving",
    drills: [
      "Underhand Serve",
      "Float Serve",
      "Jump Serve",
      "Jump Float Serve",
      "Target Serving (zones)",
      "Short Serves",
      "Deep Serves",
    ],
  },
  {
    id: "blocking-defense",
    name: "Blocking & Defense",
    drills: [
      "Block Footwork",
      "Solo Block Jumps",
      "Block & Transition",
      "Pancake / Sprawl",
      "Reading the Hitter",
    ],
  },
  {
    id: "team-game",
    name: "Team & Game",
    drills: [
      "Queen of the Court",
      "6 on 6 Scrimmage",
      "3-Ball Game",
      "Wash Drill",
      "Serve & Pass Competition",
    ],
  },
];

export function drillsForSport(sport: Sport): DrillCategory[] {
  return sport === "wrestling" ? WRESTLING_DRILLS : VOLLEYBALL_DRILLS;
}

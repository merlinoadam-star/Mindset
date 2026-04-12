import type { Sport } from "../types";

export interface ScenarioCard {
  id: string;
  situation: string;
  options: string[]; // 3-4 options
  bestIndex: number; // index of best answer
  explanation: string; // why the best answer is best
  category: "tactics" | "mental" | "teamwork" | "recovery";
}

// -----------------------------------------------------------------------------
// Wrestling scenarios
// -----------------------------------------------------------------------------
export const WRESTLING_SCENARIOS: ScenarioCard[] = [
  {
    id: "w-tied-3rd",
    situation:
      "You're tied 2-2 at the start of the 3rd period. The ref flips the coin — you win. What do you choose?",
    options: ["Top", "Bottom", "Neutral", "Defer"],
    bestIndex: 1,
    explanation:
      "Bottom is the highest-percentage choice: a 1-point escape ties you for the lead, and if it goes to OT you still get your pick. If your stand-up is solid, bottom wins matches.",
    category: "tactics",
  },
  {
    id: "w-pinned-p1",
    situation:
      "It's the first match of the tournament. You just got pinned in the first period. You have another match in 45 minutes. Best response?",
    options: [
      "Hide your face, don't talk to anyone, let the anger build",
      "Quickly flush it: 3 deep breaths, one lesson, move to next warm-up",
      "Watch the guy who pinned you dominate his next match for motivation",
      "Tell the coach you're done — you can't recover",
    ],
    bestIndex: 1,
    explanation:
      "Short memory wins tournaments. Elite wrestlers recover fast — acknowledge, extract one lesson, and get back to your next match. Rumination is a killer.",
    category: "mental",
  },
  {
    id: "w-big-opponent",
    situation:
      "You're wrestling a much bigger, stronger opponent at the same weight (they cut hard). Best 1st-period strategy?",
    options: [
      "Match their strength head-on — prove you belong",
      "Wrestle at a fast pace with lots of motion to drain their energy",
      "Stall and hope they attack first so you can counter",
      "Shoot as fast as possible and hope to get lucky",
    ],
    bestIndex: 1,
    explanation:
      "Heavy cuts = low gas tank. A high pace with constant motion breaks them by period 3. Resist the urge to stall or go head-to-head in a strength battle.",
    category: "tactics",
  },
  {
    id: "w-leading",
    situation:
      "You're up 7-1 with 30 seconds left. You're on top. They're hand fighting aggressively. What do you do?",
    options: [
      "Cut them and take neutral — force the takedown",
      "Ride tough, stay chest-to-back, run the clock",
      "Go for the pin with a tilt",
      "Stand up and disengage for the rest of the match",
    ],
    bestIndex: 1,
    explanation:
      "Up big, you protect the lead. A tilt attempt that gets countered into a 5-point move costs you the match. Ride smart, control the tie-ups, let the clock work.",
    category: "tactics",
  },
  {
    id: "w-tough-coach",
    situation:
      "Your coach just yelled at you in front of the team after a bad practice rep. You feel embarrassed and angry. What's the best play?",
    options: [
      "Sulk for the rest of practice — you've earned a break",
      "Take one breath, go hard on the next rep, talk to coach after",
      "Talk back — stand up for yourself",
      "Pretend it didn't happen and ignore coach for a week",
    ],
    bestIndex: 1,
    explanation:
      "Respond with action, not emotion. Hard coaching is usually a signal they believe in you. The next rep is your answer.",
    category: "mental",
  },
  {
    id: "w-weigh-in-cut",
    situation:
      "Weigh-ins are in 4 hours and you're 2 pounds over. You haven't eaten all day and your head is spinning. Best move?",
    options: [
      "Sauna suit + heavy cardio for 2 hours straight",
      "Tell your coach — consider moving up a weight or getting proper guidance",
      "Drink coffee to kill hunger and work out harder",
      "Try a laxative — everyone does it",
    ],
    bestIndex: 1,
    explanation:
      "Unhealthy cuts hurt your performance AND your health. A proper cut is planned over days, not hours. Coach communication > crash methods every time.",
    category: "recovery",
  },
  {
    id: "w-lost-first",
    situation:
      "You lost your first match by a tight decision. Now you're in the consolation bracket. Mental focus should be?",
    options: [
      "I'm out of the finals — this tournament is basically done",
      "Third place is still on the podium. Match-by-match focus.",
      "I need to dominate my next opponent to make up for it",
      "I'll coast and save energy for the next tournament",
    ],
    bestIndex: 1,
    explanation:
      "Consolation brackets are where champions get made. Same process focus, one match at a time. Placing 3rd is a real accomplishment — and you might wrestle the returning state champ.",
    category: "mental",
  },
  {
    id: "w-cramping",
    situation:
      "Mid-match in the 2nd period, your hamstring starts cramping. 90 seconds left. What do you do?",
    options: [
      "Immediately ask for an injury timeout to save yourself",
      "Shift your stance, stay active but conservative, breathe deep, drink water next break",
      "Pretend nothing is wrong, attack harder to end it quick",
      "Walk off the mat",
    ],
    bestIndex: 1,
    explanation:
      "Injury time is a valuable resource — don't burn it on a cramp. Adjust technique, fight through, hydrate next break. Attacking harder risks real injury.",
    category: "recovery",
  },
];

// -----------------------------------------------------------------------------
// Volleyball scenarios
// -----------------------------------------------------------------------------
export const VOLLEYBALL_SCENARIOS: ScenarioCard[] = [
  {
    id: "v-24-24-serve",
    situation:
      "It's 24-24 in set 5. You're about to serve. Your last two serves were errors. What's your mindset?",
    options: [
      "Go harder — you need an ace here",
      "Play it safe — just get it over, anywhere",
      "Same routine as every other serve. Breathe. Trust it.",
      "Ask the setter to give you a pep talk",
    ],
    bestIndex: 2,
    explanation:
      "Routine beats pressure. Breathe, same toss, same contact point. Outcome thinking (need an ace) creates tension; process thinking (good routine) creates confidence.",
    category: "mental",
  },
  {
    id: "v-3-errors",
    situation:
      "You just made 3 hitting errors in a row. Coach subs in another hitter. You're on the bench. Best response?",
    options: [
      "Sulk with your head down, text a friend",
      "Throw your knee pads, show you care",
      "Watch the game actively, cheer loud, stay warm — you'll be back in",
      "Tell yourself you're not cut out for this",
    ],
    bestIndex: 2,
    explanation:
      "Bench time is an audition for coach to put you back in. Active support and readiness > sulking. You're always one moment away from being called on.",
    category: "mental",
  },
  {
    id: "v-bad-set",
    situation:
      "Your setter delivers a bad ball — too far off the net. You're the hitter. Best decision?",
    options: [
      "Force a hard swing and hope for the best",
      "Set it back over as a free ball or use a clean tip/roll shot",
      "Let it drop — it's not your fault",
      "Yell at the setter",
    ],
    bestIndex: 1,
    explanation:
      "Smart attackers know when to 'not hit.' A controlled free ball or placed tip is WAY better than a forced swing that becomes a block or a ball into the net.",
    category: "tactics",
  },
  {
    id: "v-short-serve",
    situation:
      "Opposing team is serving tough float serves to your weak passer. Your pass rating is dropping. Team is down 12-18. What's the best call?",
    options: [
      "Have your libero take everything, even if she's out of position",
      "Let the weak passer keep getting them — they need reps",
      "Call a quick huddle, tighten up seams and cover her — team wins",
      "Complain to the ref about the serve line",
    ],
    bestIndex: 2,
    explanation:
      "Serving tough at a weak passer is strategy. Adjust your formation — tighten seams, have better passers cover. Team-wide adjustment wins, not singling out a player.",
    category: "teamwork",
  },
  {
    id: "v-timeout",
    situation:
      "You've lost 5 points in a row. Coach calls timeout. What should YOU be doing in the huddle?",
    options: [
      "Drink water quietly and wait for directions",
      "Argue with the teammate who shanked the last pass",
      "Bring energy — eyes up, encourage teammates, commit to your next job",
      "Check the scoreboard and do the math",
    ],
    bestIndex: 2,
    explanation:
      "Timeouts are momentum resets. Your job is to bring energy AND clarity. Panic and blame extend the skid. Leaders in the huddle are the ones who bring the group back.",
    category: "teamwork",
  },
  {
    id: "v-injured-teammate",
    situation:
      "Your starting setter rolls an ankle and comes out. The backup setter is nervous. What's the best thing for you (as a hitter) to do?",
    options: [
      "Demand perfect sets — anything less is unacceptable",
      "Tell her exactly where and how you want the ball, be patient, swing at any set",
      "Stop hitting hard until she's comfortable",
      "Complain to the coach about the sub",
    ],
    bestIndex: 1,
    explanation:
      "Great hitters make average setters look good. Clear communication + swinging at any set builds her confidence fast. Patience + aggression wins the rotation.",
    category: "teamwork",
  },
  {
    id: "v-tip-the-net",
    situation:
      "Your team is up 24-20 in set 1. Opponent has their strongest server. You're passing. What's your focus?",
    options: [
      "Aggressive swing on the first ball — end it quick",
      "Call the ball early, platform to target, trust your passing prep",
      "Take one step back — give yourself more time",
      "Try to read her toss and predict the serve",
    ],
    bestIndex: 1,
    explanation:
      "Simplify under pressure. Platform mechanics + early call = clean pass. Over-adjusting (step back) or over-reading (predict) usually causes errors. Trust the reps.",
    category: "tactics",
  },
  {
    id: "v-no-sleep",
    situation:
      "You slept 4 hours last night. You have a big tournament today. How do you handle it?",
    options: [
      "Drink 3 energy drinks to power through",
      "Hydrate well, eat balanced meals, warm up longer, focus on simple execution",
      "Tell coach you can't play",
      "Skip warm-up to save energy",
    ],
    bestIndex: 1,
    explanation:
      "Poor sleep hurts reaction time. Compensate with hydration, nutrition, and longer warm-up. Simplify your game — low-risk decisions beat ambitious ones when you're tired.",
    category: "recovery",
  },
];

export function scenariosForSport(sport: Sport): ScenarioCard[] {
  return sport === "wrestling"
    ? WRESTLING_SCENARIOS
    : VOLLEYBALL_SCENARIOS;
}

export const SCENARIO_ROUND_SIZE = 3;
export const XP_PER_CORRECT_SCENARIO = 15;
export const PERFECT_SCENARIO_ROUND_BONUS = 20;

export function pickScenarioRound(
  sport: Sport,
  roundIndex: number
): ScenarioCard[] {
  const pool = scenariosForSport(sport);
  // Deterministic shuffle by round index
  const seed = roundIndex * 8191 + 101;
  const indices = pool.map((_, i) => i);
  let s = seed;
  for (let i = indices.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, SCENARIO_ROUND_SIZE).map((i) => pool[i]);
}

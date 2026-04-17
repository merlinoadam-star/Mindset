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
  {
    id: "w-best-friend",
    situation:
      "You draw your best friend in the bracket. You hang out every weekend. The ref says 'Shake hands.' What's your mindset?",
    options: [
      "Go easy — you don't want to hurt the friendship",
      "He's your opponent for 6 minutes. Compete hard, hug after. Real friends respect that.",
      "Try to embarrass him — this is your chance to prove who's better",
      "Forfeit so neither of you has to deal with it",
    ],
    bestIndex: 1,
    explanation:
      "Competing hard against a friend IS respect. Holding back disrespects both of you. After the whistle, shake hands and go back to being friends — that's what real competitors do.",
    category: "mental",
  },
  {
    id: "w-bad-ref",
    situation:
      "The ref no-calls a stalling warning on your opponent who's clearly running. You're down 2-1. 30 seconds left. What do you do?",
    options: [
      "Complain to the ref loudly so everyone knows",
      "Stop wrestling and argue your case",
      "Let your coach challenge it — you keep attacking and force the action",
      "Accept defeat since the ref is unfair",
    ],
    bestIndex: 2,
    explanation:
      "Your coach handles the table. You handle the mat. Complaining wastes time and energy. Attack harder — the best answer to a bad call is a takedown.",
    category: "mental",
  },
  {
    id: "w-nerves",
    situation:
      "It's warm-ups before your first match at the state tournament. Your legs are shaky, your stomach hurts, you can barely breathe. Best response?",
    options: [
      "Tell your coach you're too nervous to wrestle",
      "Ignore it, put your headphones in, and pretend you're fine",
      "Name it: 'I'm nervous. Good — that means I care.' Then 4 box breaths.",
      "Shadow wrestle as hard as possible to burn off the adrenaline",
    ],
    bestIndex: 2,
    explanation:
      "Nerves aren't the enemy — they're fuel. Naming the feeling takes its power away. Four box breaths drop your heart rate. Then use the energy, don't fight it.",
    category: "mental",
  },
  {
    id: "w-parent-loss",
    situation:
      "You lost a tough match. Walking off the mat, your parent says 'You should have hit that shot in the 2nd period.' You're frustrated. Best response?",
    options: [
      "Yell back — they don't know what it's like out there",
      "Nod, say 'Thanks, I'll think about it,' and process it later",
      "Stop talking to your parent for the rest of the tournament",
      "Agree and beat yourself up about it for the next hour",
    ],
    bestIndex: 1,
    explanation:
      "Parents mean well even when the timing is bad. Acknowledge, don't engage in the moment. Process after the tournament when emotions are cooler. Protect your mental energy between matches.",
    category: "mental",
  },
  {
    id: "w-trash-talk",
    situation:
      "Your opponent is jawing at you during the match — bumping hard on restarts, talking trash. You're getting heated. What's the move?",
    options: [
      "Talk trash back — don't let them punk you",
      "Tell the ref to penalize them",
      "Smile. Stay silent. Score. Let the scoreboard do the talking.",
      "Shove them hard to send a message",
    ],
    bestIndex: 2,
    explanation:
      "Trash talk is a trap. If you react, they won. If you score, you win. Composure under provocation is the ultimate flex. The scoreboard is the only answer that matters.",
    category: "mental",
  },
  {
    id: "w-underdog",
    situation:
      "You're about to wrestle the #1 seed. He's beaten you twice. Your teammates are already saying 'tough draw.' What do you tell yourself?",
    options: [
      "They're right — just don't get pinned",
      "Forget the seed. 6 minutes. Wrestle YOUR match. Anything can happen.",
      "Try some moves you've never practiced — surprise is your only shot",
      "Go all-out in the first 30 seconds and hope for a quick pin",
    ],
    bestIndex: 1,
    explanation:
      "Seeds don't score points. Your technique does. Stick to your best stuff, wrestle hard for 6 minutes. Upsets happen to athletes who refuse to be intimidated.",
    category: "mental",
  },
  {
    id: "w-injury-match",
    situation:
      "You tweaked your shoulder in warm-ups. You can move it but it hurts. Your match is in 10 minutes. What do you do?",
    options: [
      "Push through and don't tell anyone — showing weakness is bad",
      "Forfeit immediately — it's not worth risking more damage",
      "Tell your coach and the trainer. Get an honest assessment. Adjust your plan if you go.",
      "Take 4 ibuprofen and hope for the best",
    ],
    bestIndex: 2,
    explanation:
      "Hiding injuries is dangerous. Coach and the trainer can help you decide and adjust. Playing smart doesn't mean quitting — it means informed decisions.",
    category: "recovery",
  },
  {
    id: "w-teammate-negative",
    situation:
      "A teammate lost bad and is now complaining about everything — the refs, the bracket, the coaching. His negativity is spreading. You have a match soon. What do you do?",
    options: [
      "Join in — he's making valid points",
      "Walk away quietly, put your headphones on, and start your pre-match routine",
      "Tell him to shut up in front of everyone",
      "Agree with him so he feels better",
    ],
    bestIndex: 1,
    explanation:
      "Negativity is contagious. Protect your headspace. You can support him AFTER the tournament — right now, your job is to be ready for your match. Remove yourself with no drama.",
    category: "mental",
  },
  {
    id: "w-big-win",
    situation:
      "You just beat the #2 seed in the quarterfinals! Everyone is congratulating you. Your semifinal is in 90 minutes. How do you handle it?",
    options: [
      "Celebrate hard — you earned it, post it on social media right now",
      "Thank everyone, give yourself 5 minutes to enjoy it, then get back to work",
      "Act like it never happened — show no emotion",
      "Skip warm-ups for the next match — you're on a roll",
    ],
    bestIndex: 1,
    explanation:
      "Celebrate briefly, then refocus. The next match doesn't care about the last one. Five minutes of pride, then back to your process. Champions finish tournaments, not just matches.",
    category: "mental",
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
  {
    id: "v-best-friend",
    situation:
      "You're playing against your best friend's team in the semifinals. She's their best hitter. You're blocking her. What's the play?",
    options: [
      "Go easy on her blocks so she doesn't feel bad",
      "Block her like any other hitter. Compete hard, hug at the net after.",
      "Try extra hard to embarrass her — bragging rights matter",
      "Ask coach to move you to a different position",
    ],
    bestIndex: 1,
    explanation:
      "Competing your best against a friend IS the ultimate respect. Holding back disrespects her skill and your team. After the match, the friendship is right where you left it.",
    category: "mental",
  },
  {
    id: "v-bad-ref",
    situation:
      "The ref calls your hit out. You KNOW it landed in. Coach used both challenges. You lost the point. Best response?",
    options: [
      "Slam the ball — let the ref know you're angry",
      "Stare at the ref and shake your head every play",
      "Next-ball mentality. Nothing you can do about it. Win the next rally.",
      "Argue from the court until the ref gives a warning",
    ],
    bestIndex: 2,
    explanation:
      "One point doesn't decide a set. Anger about a call bleeds into the next 3-4 rallies and costs you more. Next ball, clean slate — that's the competitive edge.",
    category: "mental",
  },
  {
    id: "v-nerves-serve",
    situation:
      "You're about to serve for the first time in a varsity game. Your hands are sweating, your heart is pounding. What do you do?",
    options: [
      "Rush the serve to get it over with fast",
      "Take your time. Wipe your hands. Three breaths. Same routine you practiced 500 times.",
      "Try to hit the hardest serve of your life to make an impression",
      "Ask to be taken out of the serving rotation",
    ],
    bestIndex: 1,
    explanation:
      "Your routine is your anchor. Slow down — the serve clock gives you time. Wipe, breathe, target, toss, contact. The routine overrides the nerves. Trust it.",
    category: "mental",
  },
  {
    id: "v-parent-pressure",
    situation:
      "Your parent keeps texting you from the stands: 'You need to hit harder,' 'Why aren't you starting?' It's distracting. Best move?",
    options: [
      "Check your phone between sets and respond",
      "Put your phone in your bag on silent. Deal with it after the match.",
      "Wave at them to stop from the court",
      "Tell coach your parent is being annoying",
    ],
    bestIndex: 1,
    explanation:
      "Phone in the bag. Period. Parental feedback between sets destroys focus. Thank them after, set boundaries respectfully later — but during the match, you're a player, not a daughter/son.",
    category: "mental",
  },
  {
    id: "v-team-down-bad",
    situation:
      "You're down 3-15 in set 2 after losing set 1 badly. Two teammates are crying. Energy is dead. You're the captain. What do you do?",
    options: [
      "Tell everyone to stop being emotional — toughen up",
      "Accept the loss — save energy for next match",
      "Quick team huddle: 'Win the next 3 points. That's it.' Small targets, loud energy.",
      "Try to carry the whole team by yourself",
    ],
    bestIndex: 2,
    explanation:
      "Big deficits feel impossible. Break it into bites — 'Win the next 3.' Achievable targets restore belief. Your energy is contagious. Leaders don't fix the whole score — they fix the next point.",
    category: "teamwork",
  },
  {
    id: "v-dropped-starter",
    situation:
      "Coach moves you from starter to the bench for the next tournament. You've been starting all season. How do you respond?",
    options: [
      "Refuse to cheer — they'll see how much they need you",
      "Ask coach calmly what you need to work on, then commit to earning it back",
      "Post about it on social media",
      "Tell your parent to call the coach",
    ],
    bestIndex: 1,
    explanation:
      "Maturity wins roster spots. Coaches respect athletes who respond to adversity with work, not drama. Ask 'What do I need to do?' — then do it. That conversation builds trust.",
    category: "mental",
  },
  {
    id: "v-choke",
    situation:
      "You were 8-for-8 on kills this match. Then you hit 3 errors in a row. Setter keeps giving you the ball. You feel like you're choking. What do you do?",
    options: [
      "Wave off the setter — stop giving me the ball",
      "Swing even harder to force your way out of it",
      "Take one breath. Trust your arm. Attack a different zone. One good swing resets everything.",
      "Start tipping every ball to avoid another error",
    ],
    bestIndex: 2,
    explanation:
      "Choking is just overthinking. One breath, one adjustment (try a different shot), and trust the 8 kills you already had. The setter is feeding you because you're their weapon. Act like it.",
    category: "mental",
  },
  {
    id: "v-injury-ankle",
    situation:
      "You rolled your ankle in warm-ups. It's swelling but you can walk. You're the starting libero and there's no backup. What do you do?",
    options: [
      "Play through it — the team needs you, no matter what",
      "Tell coach and the trainer immediately. Get taped. Let them decide.",
      "Sit out and don't tell anyone why",
      "Take painkillers and ice it during timeouts",
    ],
    bestIndex: 1,
    explanation:
      "Playing on a bad ankle risks a worse injury AND hurts your team if you can't move. Trainer assessment + proper taping might let you play. Coach needs honest info to make the best call.",
    category: "recovery",
  },
  {
    id: "v-negative-teammate",
    situation:
      "Between sets, your outside hitter is ripping the middle for 'not blocking well enough.' The middle is almost in tears. You're the setter. How do you handle it?",
    options: [
      "Stay out of it — not your problem",
      "Quietly pull the outside aside: 'I need you to build her up, not tear her down. We need her.'",
      "Take the outside's side — the blocking IS bad",
      "Tell coach to deal with the drama",
    ],
    bestIndex: 1,
    explanation:
      "Setters lead the offense. A private word to the outside protects the middle's confidence without embarrassing anyone. Teams that eat each other lose. Teams that protect each other win.",
    category: "teamwork",
  },
  {
    id: "v-big-upset",
    situation:
      "You just beat the #1 team in pool play! Everyone is screaming. You play the next match in 30 minutes. What's the move?",
    options: [
      "Post about it immediately, ride the energy all day",
      "Celebrate for 5 minutes, then regroup: 'That was great. Now forget it. Next match, same process.'",
      "Tell the next opponent about your win to intimidate them",
      "Skip warm-up — you're already fired up",
    ],
    bestIndex: 1,
    explanation:
      "Peak emotional highs lead to flat next performances. Celebrate, then compartmentalize. The next team doesn't care about your last win. Stay hungry, stay ready.",
    category: "mental",
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

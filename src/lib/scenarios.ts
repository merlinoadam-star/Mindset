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
  {
    id: "w-down-late",
    situation:
      "Down 4-2 with 25 seconds left. You're on bottom. What's the call?",
    options: [
      "Wait for the whistle and try a stand-up — takedowns are 2 points and you only need 2",
      "Explode on the whistle: stand up immediately, then attack a takedown before time runs out",
      "Bridge hard for a reversal",
      "Stall to avoid getting stuck — tie the match in OT",
    ],
    bestIndex: 1,
    explanation:
      "You need 2+ points in 25 seconds. Instant stand-up to create the escape AND force a scramble opportunity. Passive waiting wastes the only time you have.",
    category: "tactics",
  },
  {
    id: "w-mid-period-pins",
    situation:
      "You get caught in a headlock and go to your back. Ref is counting. Options?",
    options: [
      "Close your eyes and hope for the whistle",
      "Drive your chest toward the mat, bridge hard, and keep fighting",
      "Give up to avoid the pin — save points for next match",
      "Argue with the ref about the count",
    ],
    bestIndex: 1,
    explanation:
      "Never stop fighting on your back. Bridge, turn toward the trapped arm, work your way out. Wrestlers who keep fighting escape pins — those who give up give up matches.",
    category: "tactics",
  },
  {
    id: "w-locker-room-cut",
    situation:
      "A teammate is making weight the wrong way — laxatives, hidden food purging. You've seen it twice. What do you do?",
    options: [
      "Mind your own business — not your weight, not your problem",
      "Tell the coach or trainer quietly — this can be life-threatening",
      "Confront them publicly in front of the team",
      "Post a vague callout on social media",
    ],
    bestIndex: 1,
    explanation:
      "Disordered eating in wrestling is dangerous and common. Telling a trusted adult isn't snitching — it's protecting a teammate's life. Private > public is the right call.",
    category: "teamwork",
  },
  {
    id: "w-practice-injury",
    situation:
      "Two days before a tournament, you tweak your knee in a live go. It's a little swollen but you can walk. What's the best play?",
    options: [
      "Keep going hard — you need the reps",
      "Ice, compression, rest for 24 hours, tell the trainer, re-assess tomorrow",
      "Skip practice all week just to be safe",
      "Wrap it tight and lie to coach so you can wrestle"
    ],
    bestIndex: 1,
    explanation:
      "Early care prevents minor tweaks from becoming tournament-ending injuries. Honesty with coach and trainer = better decisions. Hiding injuries blows up a whole season.",
    category: "recovery",
  },
  {
    id: "w-backup-step-up",
    situation:
      "The starter at your weight gets sick the day of duals. Coach tells you you're in. You've been wrestling JV. What's your mindset?",
    options: [
      "Freak out — I'm not ready for this",
      "This is what I've trained for. Same match I wrestle every day — just a different singlet. Go.",
      "Ask coach if someone else can go instead",
      "Go easy so I don't embarrass myself"
    ],
    bestIndex: 1,
    explanation:
      "Opportunity doesn't announce itself. You've been preparing for this. Treat it like any other match — same technique, same effort. Stepping up builds confidence for the next time.",
    category: "mental",
  },
  {
    id: "w-tough-workout-morning",
    situation:
      "You slept poorly and practice is in 30 minutes. You feel exhausted. What do you do?",
    options: [
      "Skip practice — you need the sleep",
      "Go in and go hard — no excuses",
      "Go in, tell coach you're running on fumes, work the mental reps and technique at 80%",
      "Drink two energy drinks and push through full speed"
    ],
    bestIndex: 2,
    explanation:
      "Showing up is half the battle. Honest communication lets coach adjust the plan. Grinding at 80% on fundamentals is smarter than red-lining and risking injury.",
    category: "recovery",
  },
  {
    id: "w-drill-partner-slacking",
    situation:
      "Your drill partner keeps going light — not resisting, not giving real looks. Your reps are getting sloppy. How do you handle it?",
    options: [
      "Just push through it — your partner isn't your problem",
      "Calmly ask for more resistance: 'Give me 60% — I need better looks'",
      "Complain to coach about them",
      "Go hard on them to teach them a lesson"
    ],
    bestIndex: 1,
    explanation:
      "Direct, respectful communication first. Most partners don't realize they're going too light. Frame it as 'help me get better' — not 'you suck'. Save the coach conversation for if it keeps happening.",
    category: "teamwork",
  },
  {
    id: "w-hard-weeks",
    situation:
      "You haven't wrestled well in 3 matches. Confidence is low. You feel like quitting. What's the move?",
    options: [
      "Quit — it's clearly not for you",
      "Have a real conversation with coach about what's going wrong, then lean into the work",
      "Stop caring about results to protect your ego",
      "Blame your coach and change schools"
    ],
    bestIndex: 1,
    explanation:
      "Slumps are temporary if you address them. Coach can see things you can't. The way out is usually technical + mental — fix what's broken, trust the process, results return.",
    category: "mental",
  },
  {
    id: "w-bad-draw",
    situation:
      "Bracket comes out. You have the returning state champ in round 1. Your teammates look shocked. What's your thought?",
    options: [
      "'Great — no pressure, all opportunity. If I lose, expected. If I win, legend.'",
      "'Unfair draw. The bracket was rigged.'",
      "'I should fake an injury and drop out'",
      "'I'll just survive and hope for a lucky scramble'"
    ],
    bestIndex: 0,
    explanation:
      "Reframe the draw. Heavy favorites have everything to lose; you have everything to gain. Wrestle loose, trust your attack, leave it on the mat — upsets happen every tournament.",
    category: "mental",
  },
  {
    id: "w-teammate-choking",
    situation:
      "Your teammate is about to wrestle in the finals. You can tell they're freaking out — shaky, not warming up. You finished 3rd already. What's your move?",
    options: [
      "Leave them alone — they need to figure it out themselves",
      "Remind them of one specific thing they did well today, walk them through their warm-up",
      "Tell them they look scared and need to toughen up",
      "Give them a pep talk about the crowd watching"
    ],
    bestIndex: 1,
    explanation:
      "Calm presence + a concrete win recall beats motivational speeches. Shrink the focus to one thing they own. Walk them through the warm-up like any other match — routine steadies nerves.",
    category: "teamwork",
  },
  {
    id: "w-first-varsity-loss",
    situation:
      "Your first varsity match — you just got tech-falled. Coach is quiet. Your parents look disappointed. What do you do?",
    options: [
      "Never wrestle again — clearly not your level",
      "Review the match with coach, identify 2 things to work on, commit to next practice",
      "Blame the ref and the opponent for being dirty",
      "Spiral — tell yourself you're terrible"
    ],
    bestIndex: 1,
    explanation:
      "Every varsity wrestler's first loss is brutal. The ones who stick with it extract lessons and come back. Your second varsity match is where growth starts.",
    category: "mental",
  },
  {
    id: "w-trash-pre-match",
    situation:
      "The opposing coach is telling their wrestler loudly that you're 'nothing' and 'easy work'. You're warming up right next to them. Your move?",
    options: [
      "Yell back at the coach",
      "Keep your earbuds in, stay in your warm-up routine, answer with your wrestling",
      "Tell your coach to confront theirs",
      "Get in the opponent's face before the whistle"
    ],
    bestIndex: 1,
    explanation:
      "Their coach trash-talking is a sign they don't think they can win clean. Don't feed the energy. Your composure is itself a statement. Let your takedowns do the talking.",
    category: "mental",
  },
  {
    id: "w-bye-round",
    situation:
      "You got a bye in round 1. You won't wrestle for 3 hours. How do you handle the downtime?",
    options: [
      "Take off your singlet, eat a big meal, nap",
      "Stay warm — light movement every 30 minutes, small snacks, watch matches actively, mental reset 15 min before",
      "Hang out with friends off-mat",
      "Do a full warm-up now so you're ready whenever"
    ],
    bestIndex: 1,
    explanation:
      "Long byes kill legs and focus. Small movements, light fueling, active scouting. Full warm-up comes 15–20 min before mat call — too early and you peak before you wrestle.",
    category: "recovery",
  },
  {
    id: "w-social-media-trashtalk",
    situation:
      "An opponent is subtweeting you — 'Easy win tomorrow' vibes. Your friends are mad and want you to clap back. What's the play?",
    options: [
      "Reply with a fire tweet — put them in their place",
      "Screenshot it, save it as motivation, stay silent, let the match speak",
      "Block them",
      "Report the account"
    ],
    bestIndex: 1,
    explanation:
      "Public beef before a match is free energy — for THEM. Silence + a dominant performance is the rarest and most powerful combo. Let your work hit louder than your typing.",
    category: "mental",
  },
  {
    id: "w-cutting-too-much",
    situation:
      "You're on a dangerous cut and barely making weight every week. Your energy in matches is low. What's the right call?",
    options: [
      "Push through — championships require sacrifice",
      "Talk to your coach and family about moving up a class. Health > weight class.",
      "Cut even more aggressively to get comfortable",
      "Find ways to sneak food while cheating the scale"
    ],
    bestIndex: 1,
    explanation:
      "Chronic under-eating hurts development, strength, and mindset. Moving up one class often wins MORE matches because your strength returns. Coaches respect athletes who advocate for long-term health.",
    category: "recovery",
  },
  {
    id: "w-freezing-up",
    situation:
      "You freeze on the whistle — you can't move, you just react. Your opponent scores. How do you respond in the next 15 seconds?",
    options: [
      "Keep freezing — hope the period ends",
      "Reset — whisper your go-to attack out loud to yourself, then execute it",
      "Get mad at yourself and force a sloppy shot",
      "Wait for the opponent's next move"
    ],
    bestIndex: 1,
    explanation:
      "A single action breaks the freeze. Verbalizing your next move (even silently) turns thinking into doing. One shot, one move, one action — restart the engine.",
    category: "mental",
  },
  {
    id: "w-cant-finish",
    situation:
      "You've shot 4 deep attacks but can't finish. Opponent keeps hip-blocking. What's the adjustment?",
    options: [
      "Keep shooting the same way — it'll break through eventually",
      "Switch to setups that expose their hip: change levels first, or snap them down",
      "Give up on takedowns, ride for points",
      "Stop attacking — don't risk another failed shot"
    ],
    bestIndex: 1,
    explanation:
      "If something isn't working, adjust. Same input = same output. A snap-down or level change breaks their hip posture and creates the opening that deep shots alone can't.",
    category: "tactics",
  },
  {
    id: "w-late-match-conditioning",
    situation:
      "It's the third period and your lungs are screaming. The opponent looks fresher. What's the mental frame?",
    options: [
      "'I'm too tired — hope he doesn't attack'",
      "'I've been to this place in practice 1000 times. One more sprint. One more breath.'",
      "'Just hold on to the tie'",
      "'If I score I win — all-in on one big shot'"
    ],
    bestIndex: 1,
    explanation:
      "Third period is mental. You've trained specifically for this moment. Anchor to the reps you've done. Opponents bluff fresh — many are as tired as you. First one to show it loses.",
    category: "mental",
  },
  {
    id: "w-losing-stance",
    situation:
      "Mid-match, you realize you've been standing up straight — head above your hips — and you've been getting snapped. Adjustment?",
    options: [
      "Stay tall — you can defend from up there",
      "Drop your level, knees bent, butt back, head up. Fix the stance first, offense second.",
      "Go defensive only — stall out the period",
      "Shoot faster before they can snap you"
    ],
    bestIndex: 1,
    explanation:
      "Stance = survival. Bad stance = exposed to snaps, easy to move. Fix posture before anything else — it's the foundation every other move rides on.",
    category: "tactics",
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
  {
    id: "v-serving-game",
    situation:
      "You're serving down 22-24. One mistake and the set's over. Your coach wants you to go aggressive. What's the right call?",
    options: [
      "Play safe — just get it in",
      "Trust your aggressive serve — a safe serve to a good team loses the set anyway",
      "Ask to be subbed out",
      "Serve to the opponent's best passer on purpose"
    ],
    bestIndex: 1,
    explanation:
      "Scared serves on match point die short or go long. Your aggressive serve got you to 22 — trust it. Good teams eat soft serves for breakfast.",
    category: "mental",
  },
  {
    id: "v-setter-nightmare",
    situation:
      "You're the setter. The first pass is shanked off the net. You have to chase it. What's the best option?",
    options: [
      "Bump set the ball to your left-side hitter — flat and fast",
      "Let it drop — can't save a bad pass",
      "Run under and try a one-handed set from 6 feet off",
      "Free-ball it over the net gently"
    ],
    bestIndex: 3,
    explanation:
      "When the pass is shanked, don't force offense. A controlled free ball resets the rally. Fancy plays from bad positions lose points. Simplify when the situation is bad.",
    category: "tactics",
  },
  {
    id: "v-starter-loss",
    situation:
      "You got moved to the bench after being the starter all year. The player who replaced you is now playing well. What do you do?",
    options: [
      "Cheer loud, study them, support them — your turn comes when coach trusts you again",
      "Sit on the bench quietly, don't engage",
      "Tell teammates you should be starting",
      "Skip the next few practices in protest"
    ],
    bestIndex: 0,
    explanation:
      "How you handle getting benched says more to a coach than your play. Active support + watching = earned trust later. Sulking = staying on the bench longer.",
    category: "mental",
  },
  {
    id: "v-ref-bad-call",
    situation:
      "Ref calls a net violation on you — you didn't touch it. Your coach calls for the review but can't overturn it. You lost the point. Next serve is coming. What's your internal state?",
    options: [
      "Dwell on it — this isn't fair",
      "One breath, 'let it go', ready position, eyes on the server",
      "Argue with the ref every time they look at you",
      "Tell teammates the ref is cheating you"
    ],
    bestIndex: 1,
    explanation:
      "Calls even out over a season. One bad call costs 1 point; dwelling costs 3-4 more points AND your team's energy. Next ball — same focus, same you.",
    category: "mental",
  },
  {
    id: "v-team-meeting",
    situation:
      "Two teammates have been feuding for a week. It's starting to hurt practice. You're a senior. What do you do?",
    options: [
      "Stay out — not your drama",
      "Pull them aside separately, hear both sides, then facilitate a conversation — or tell coach",
      "Take one side publicly",
      "Post something on the team group chat to force it out"
    ],
    bestIndex: 1,
    explanation:
      "Senior leaders solve things at the lowest level possible. Separate conversations de-escalate, then a calm face-to-face. Coach involvement is the next step if peer mediation fails.",
    category: "teamwork",
  },
  {
    id: "v-block-getting-hammered",
    situation:
      "The opposing outside is hitting through you every rotation. Your block is getting tooled or going over. What's the adjustment?",
    options: [
      "Keep blocking the same way — eventually you'll get them",
      "Press harder over the net AND watch their last hop for the shoulder angle",
      "Give up on blocking, play defense in the back row",
      "Try to hit the ball with your face"
    ],
    bestIndex: 1,
    explanation:
      "If you can't beat them with height, beat them with reads. Watch their approach and shoulder — that's where they tell you the swing direction. Then penetrate the net.",
    category: "tactics",
  },
  {
    id: "v-perfect-pass-pressure",
    situation:
      "You're serve-receiving in the biggest point of your season. The opposing server is their ace. What's your mental cue?",
    options: [
      "'Don't shank it, don't shank it'",
      "'Platform, target, breathe — just the next pass.'",
      "'I need to be perfect here'",
      "'Please don't serve at me'"
    ],
    bestIndex: 1,
    explanation:
      "Negative self-talk ('don't shank') tells your brain 'shank'. Process cues (platform, target, breathe) put attention on what you control. Simple = reliable.",
    category: "mental",
  },
  {
    id: "v-kill-celebration",
    situation:
      "You just got a massive kill to tie the game. The crowd erupts. Your next play is right now. What's the play?",
    options: [
      "Celebrate hard with teammates, take your time",
      "Quick team tap, back to ready position, eyes up — next ball is yours to earn",
      "Stare down the opposing blocker",
      "Look into the crowd for your parents"
    ],
    bestIndex: 1,
    explanation:
      "Short celebration, long focus. Top teams celebrate for 2 seconds and reset. Long celebrations drain energy + tell the opponent you peaked — they regroup while you're posing.",
    category: "mental",
  },
  {
    id: "v-library-down",
    situation:
      "The libero just dove and is slow to get up after a dig. The play continues. Your opponent attacks her zone. What do you do?",
    options: [
      "Assume she's got it — she's a pro",
      "Communicate loudly — 'Got it!' — and cover her zone yourself",
      "Wait to see if she can get up",
      "Run her off the court"
    ],
    bestIndex: 1,
    explanation:
      "Communication wins rallies. When a teammate is compromised, cover without waiting to be asked. Teams that cover each other's weaknesses turn defense into offense.",
    category: "teamwork",
  },
  {
    id: "v-warmup-miss",
    situation:
      "You missed every single hit in warm-ups. Now the match is starting and you're up to hit. What's your approach?",
    options: [
      "Tip everything the first few times to avoid errors",
      "Your warm-up isn't your match. Trust your reps. Swing with intent on your first opportunity.",
      "Ask the setter to give you easy sets",
      "Fake a minor injury to sit out the first rotation"
    ],
    bestIndex: 1,
    explanation:
      "Warm-up misses don't mean match misses. Pros have bad warm-ups and great games all the time. Commitment + clear target resets your swing. Tipping all match = predictable.",
    category: "mental",
  },
  {
    id: "v-crowd-heckling",
    situation:
      "The opposing student section is chanting your name and a rude nickname every time you serve. You're getting rattled. What do you do?",
    options: [
      "Make a gesture at them",
      "Laugh internally — 'they only heckle people they're worried about' — then run your routine",
      "Ask the ref to stop them",
      "Miss on purpose so you stop serving"
    ],
    bestIndex: 1,
    explanation:
      "Heckling is a compliment in disguise. Reframe it: they're scared of you. Go back to your routine — same toss, same contact — and let your serve shut them up.",
    category: "mental",
  },
  {
    id: "v-playing-after-illness",
    situation:
      "You had the flu 3 days ago. You feel 80%. Coach wants you in the starting lineup. What's the right move?",
    options: [
      "Start and go 100% like nothing happened",
      "Tell coach honestly where you're at so they can plan subs — then go as hard as you can",
      "Pretend you're sicker than you are to avoid starting",
      "Play but go easy without telling coach"
    ],
    bestIndex: 1,
    explanation:
      "Honest communication lets coach manage your minutes. You going 80% with rest is better for the team than 100% for 10 points and then gassed for the set. Adults make adult decisions.",
    category: "recovery",
  },
  {
    id: "v-captain-silence",
    situation:
      "You're the team captain. The team lost a tight match. In the locker room, nobody is talking. What do you say?",
    options: [
      "Nothing — let the loss sink in",
      "Acknowledge the loss, name ONE thing the team did great, name ONE thing to work on next practice, end with 'We go again'",
      "Make a long emotional speech about never giving up",
      "Chew out specific teammates"
    ],
    bestIndex: 1,
    explanation:
      "Captains shape the 15 minutes after a loss. Brief, honest, forward-looking. Silence lets doubt fester. A specific win-and-lesson turns the loss into fuel for the next practice.",
    category: "teamwork",
  },
  {
    id: "v-set-lag",
    situation:
      "Your setter keeps setting too tight to the net — making it easy for blockers. You've told her twice. It's still happening. What's your next move?",
    options: [
      "Yell at her in front of the team",
      "Between points: 'Pull it 2 feet off — I need the space'. Clear, specific, respectful.",
      "Stop hitting her sets — tip everything",
      "Complain to the coach mid-match"
    ],
    bestIndex: 1,
    explanation:
      "Feedback should be specific + actionable ('pull it 2 feet') not emotional ('your sets suck'). Setters can adjust with clear input but not with frustration. Respect wins reps.",
    category: "teamwork",
  },
  {
    id: "v-coach-sub-quiet",
    situation:
      "Coach subs you in mid-rotation. You'll serve in 2 rotations. What do you do right now?",
    options: [
      "Find my spot, eyes up, watch the game, stay loose",
      "Hurry to my position — panic face",
      "Ask the ref what just happened",
      "Whisper 'don't mess up' to yourself"
    ],
    bestIndex: 0,
    explanation:
      "Subs happen. Walk in like you belong. Active observation of the game tempo + loose body = smooth first touch. Calm presence radiates to teammates.",
    category: "mental",
  },
  {
    id: "v-pre-tournament-nerves",
    situation:
      "It's the night before the biggest tournament of the year. You can't sleep. What do you do?",
    options: [
      "Stare at the ceiling and will yourself to sleep",
      "Get out of bed, dim the lights, 10 min of box breathing, read something light, back to bed",
      "Scroll your phone to tire yourself out",
      "Take sleeping pills"
    ],
    bestIndex: 1,
    explanation:
      "Lying there spikes stress. Get up, reset the nervous system, return when sleepy. Even 5 hours of decent sleep after reset beats 8 hours of rolling anxiety. Phones at night = worse sleep.",
    category: "recovery",
  },
  {
    id: "v-bench-teammate-down",
    situation:
      "You're on the bench. A teammate on the court just made a huge error and looks devastated. Next timeout is in 5 points. What do you do?",
    options: [
      "Wait for the timeout to talk to her",
      "Stand up, catch her eye, clap hard, mouth 'let's go' — right now",
      "Text her from the bench",
      "Say something to coach about subbing her out"
    ],
    bestIndex: 1,
    explanation:
      "Support can't wait 5 points. A single visible clap + eye contact from the bench pulls a teammate back before the next rally. Later is too late — right now is how teams stay together.",
    category: "teamwork",
  },
  {
    id: "v-wrong-play-call",
    situation:
      "Your setter called a quick, but the middle isn't ready. The ball is already in the air. What do you do as the setter?",
    options: [
      "Set the quick anyway — commit to the call",
      "Read it instantly, set the outside hitter instead — audible",
      "Overhand the ball over the net",
      "Let the ball drop"
    ],
    bestIndex: 1,
    explanation:
      "Great setters see what IS, not what they called. Adjust live. An outside hitter swinging is infinitely better than a quick with nobody there. Audibles are the sign of a high-IQ setter.",
    category: "tactics",
  },
  {
    id: "v-post-match-feedback",
    situation:
      "Your dad corners you after the match and lists 6 things you did wrong. You played a tough match and lost. How do you respond?",
    options: [
      "Argue each point in detail",
      "'Thanks — I'll think about it after I decompress. Give me 20 minutes'",
      "Shut down and not talk to him the rest of the night",
      "Take it all in and beat yourself up"
    ],
    bestIndex: 1,
    explanation:
      "Setting boundaries politely is healthy. Post-match adrenaline + criticism = conflict. A 20-minute decompression lets you actually absorb the feedback later — or push back respectfully if it's not helpful.",
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

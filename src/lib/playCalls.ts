import type { Sport } from "../types";

/**
 * Play Call — speed-round mini-game. Each call is a compact sport
 * situation with 2–3 options and a 7-second timer. Rewards reflex +
 * judgment under pressure.
 *
 * Content is shorter than Scenarios on purpose — each call must be
 * readable and decidable inside 7 seconds. 2–3 options, not 4.
 */
export interface PlayCall {
  id: string;
  situation: string; // max ~15 words — read fast
  options: [string, string] | [string, string, string];
  bestIndex: number; // 0..options.length-1
  why?: string; // optional one-line explanation, shown on review
}

export const WRESTLING_CALLS: PlayCall[] = [
  { id: "wc-1",  situation: "Tied 0-0, second period — you won the toss.",                              options: ["Top", "Bottom", "Neutral"], bestIndex: 1, why: "Bottom gets you an escape + keeps options for period 3." },
  { id: "wc-2",  situation: "Opponent shoots a deep double on you.",                                    options: ["Sprawl hard", "Back up", "Whizzer and spin"], bestIndex: 0 },
  { id: "wc-3",  situation: "Up 9-3, 20 seconds left, on top.",                                         options: ["Cut him", "Ride tough"], bestIndex: 1, why: "Don't risk a 5-point move. Ride the clock." },
  { id: "wc-4",  situation: "You get caught in a headlock going to your back.",                         options: ["Give up the pin", "Bridge + turn into it"], bestIndex: 1 },
  { id: "wc-5",  situation: "Opponent is much stronger but cut weight hard.",                          options: ["Out-muscle early", "High pace, lots of motion"], bestIndex: 1, why: "Heavy cuts = bad gas tank. Burn them out." },
  { id: "wc-6",  situation: "You shot, he sprawled, now you're under his chest.",                      options: ["Give up and restart", "Elevate + spin behind"], bestIndex: 1 },
  { id: "wc-7",  situation: "Ref calls stalling on you. You were being cautious.",                     options: ["Argue", "Attack immediately"], bestIndex: 1 },
  { id: "wc-8",  situation: "Opponent is talking trash during tie-ups.",                                options: ["Talk back", "Smile, score"], bestIndex: 1 },
  { id: "wc-9",  situation: "Down 2-1, 30 seconds left, on bottom.",                                    options: ["Stand up fast", "Wait for the shot clock"], bestIndex: 0 },
  { id: "wc-10", situation: "You're on top. He's belly-down, arm trapped.",                            options: ["Cross-face and half", "Let him up and reshoot"], bestIndex: 0 },
  { id: "wc-11", situation: "First match of tournament. You just got pinned in P1.",                   options: ["Brood", "Flush it — 3 breaths, 1 lesson, move on"], bestIndex: 1 },
  { id: "wc-12", situation: "Your opponent hits a throw — you land on your side.",                     options: ["Roll through to belly", "Stay there and stall"], bestIndex: 0 },
  { id: "wc-13", situation: "Overtime. You won the coin flip.",                                        options: ["Top", "Bottom", "Neutral"], bestIndex: 2, why: "OT neutral — first takedown wins." },
  { id: "wc-14", situation: "You have a front headlock on the edge of the mat.",                       options: ["Go for the pin now", "Drag him toward the center and score"], bestIndex: 1 },
  { id: "wc-15", situation: "Up 6-0, last 10 seconds of period 1.",                                     options: ["Hunt the pin", "Hold position — reset period 2"], bestIndex: 1 },
  { id: "wc-16", situation: "You're in warm-ups, dead nervous, stomach in knots.",                     options: ["Hide it", "Name it: 'I care.' Then breathe."], bestIndex: 1 },
  { id: "wc-17", situation: "Opponent keeps jumping the whistle.",                                      options: ["Complain", "Explode faster on the next one"], bestIndex: 1 },
  { id: "wc-18", situation: "You shot and he stuffed it. You're on both knees.",                        options: ["Stay down and grip fight", "Get back to your feet fast"], bestIndex: 1 },
  { id: "wc-19", situation: "Ref raises his hand — you won by decision.",                               options: ["Celebrate big", "Short handshake, walk off"], bestIndex: 1, why: "Save energy + respect the opponent. More matches to come." },
  { id: "wc-20", situation: "Your coach is yelling instructions mid-match.",                            options: ["Tune him out", "Grab one cue, execute it"], bestIndex: 1 },
  { id: "wc-21", situation: "You get a takedown but land off the mat.",                                 options: ["Expect 2 points", "Listen for the ref's call — sometimes 0"], bestIndex: 1 },
  { id: "wc-22", situation: "Bottom position, opponent locks hands around your torso.",                options: ["Keep wrestling silently", "Signal the ref — that's a violation"], bestIndex: 1 },
  { id: "wc-23", situation: "Your next match is in 10 minutes. You lost the last one.",                options: ["Watch the replay", "Warm up + reset mentally"], bestIndex: 1 },
  { id: "wc-24", situation: "Opponent is much longer — keeps hitting you with snap-downs.",           options: ["Stand taller to match him", "Drop your level, get inside"], bestIndex: 1 },
  { id: "wc-25", situation: "Third period. Lungs are dying. He looks fresh.",                          options: ["Hope he gets tired", "Attack first — force HIM to react"], bestIndex: 1 },
  { id: "wc-26", situation: "You got dropped by a Peterson roll. You're on your back.",                options: ["Panic", "Drive chest down, bridge, fight"], bestIndex: 1 },
  { id: "wc-27", situation: "Your parent criticizes your match loudly in the hallway.",                options: ["Engage now", "Acknowledge, process after"], bestIndex: 1 },
  { id: "wc-28", situation: "Warm-ups — your knee feels tweaky.",                                      options: ["Hide it", "Tell coach + trainer before match"], bestIndex: 1 },
  { id: "wc-29", situation: "You just pinned someone in 30 seconds.",                                  options: ["Get loose and cold", "Stay warm for the next match"], bestIndex: 1 },
  { id: "wc-30", situation: "Teammate lost bad, now trash-talking everything.",                        options: ["Join in", "Quietly excuse yourself — protect headspace"], bestIndex: 1 },
  { id: "wc-31", situation: "Opponent offers a handshake and a smile after.",                          options: ["Ignore him", "Shake firmly — look him in the eye"], bestIndex: 1 },
  { id: "wc-32", situation: "Bracket comes out — you get the #1 seed round 1.",                         options: ["Dread it", "Free roll — nothing to lose"], bestIndex: 1 },
];

export const VOLLEYBALL_CALLS: PlayCall[] = [
  { id: "vc-1",  situation: "24-24, set 5. You're serving. Last 2 were errors.",                       options: ["Safe lob", "Same routine, trust it"], bestIndex: 1 },
  { id: "vc-2",  situation: "Shanked pass, ball 8 feet off the net.",                                  options: ["Force a swing", "Free ball it over"], bestIndex: 1 },
  { id: "vc-3",  situation: "Setter is tight to the net again. You're the hitter.",                    options: ["Swing at it", "Use the block hands — tool it out"], bestIndex: 1 },
  { id: "vc-4",  situation: "You're serving. Opposing libero is weakest passer.",                      options: ["Serve safe to setter", "Serve tough at the weak passer"], bestIndex: 1 },
  { id: "vc-5",  situation: "You hit 3 errors in a row. Coach subs you out.",                          options: ["Sulk on bench", "Active cheer, watch rotations"], bestIndex: 1 },
  { id: "vc-6",  situation: "Big point — your setter runs a quick. Middle isn't there.",               options: ["Force the quick", "Audible to outside"], bestIndex: 1 },
  { id: "vc-7",  situation: "Block is bigger than you. Set is high to the outside.",                   options: ["Swing hard into seam", "Cut shot around the block"], bestIndex: 1 },
  { id: "vc-8",  situation: "Ref calls a net on you — you're sure you didn't touch.",                  options: ["Argue", "Clap, next play"], bestIndex: 1 },
  { id: "vc-9",  situation: "You're serving match point.",                                             options: ["Go for the ace", "Same routine, aim tough, commit"], bestIndex: 1 },
  { id: "vc-10", situation: "Opponent's hitter is pounding the line every ball.",                      options: ["Leave the line open", "Shift block to line — force cross"], bestIndex: 1 },
  { id: "vc-11", situation: "Libero dove hard — slow to get up. Rally still live.",                    options: ["Wait for her", "Call it and cover her zone"], bestIndex: 1 },
  { id: "vc-12", situation: "You missed every hit in warm-up.",                                        options: ["Tip all match", "Trust your swing on first opportunity"], bestIndex: 1 },
  { id: "vc-13", situation: "Opponent serves super short — right over the net.",                       options: ["Hope someone gets it", "Call 'mine' and charge"], bestIndex: 1 },
  { id: "vc-14", situation: "You're down 3-15 in set 2. Crowd is loud against you.",                   options: ["Give up the set", "'Win the next 3 points.'"], bestIndex: 1 },
  { id: "vc-15", situation: "Setter dumps the ball over. You're covering behind.",                     options: ["Watch it land", "Move forward before she sets"], bestIndex: 1 },
  { id: "vc-16", situation: "Your best hitter is subbed out. Backup is green.",                        options: ["Keep setting same stuff", "Feed her easy high sets to build confidence"], bestIndex: 1 },
  { id: "vc-17", situation: "You're reading the setter's hands — quick set to middle.",                options: ["Wait to see the hit", "Commit — jump block with middle"], bestIndex: 1 },
  { id: "vc-18", situation: "Tough float serve coming right at you.",                                   options: ["Back up to make time", "Stay — platform early, shuffle"], bestIndex: 1 },
  { id: "vc-19", situation: "Opponent just hit a bomb — ball goes off the ceiling.",                   options: ["Keep playing", "Stop — it's dead (in most rules)"], bestIndex: 0, why: "Many gyms allow ceiling continuation on your own side if first contact." },
  { id: "vc-20", situation: "You set a ball slightly tight. Hitter yells at you.",                      options: ["Argue back", "Nod, 'I got you next one'"], bestIndex: 1 },
  { id: "vc-21", situation: "You're the captain. Two teammates are beefing.",                          options: ["Take a side", "Pull each aside privately"], bestIndex: 1 },
  { id: "vc-22", situation: "Between sets, team energy is flat.",                                       options: ["Stay quiet", "Start the huddle — loud + short"], bestIndex: 1 },
  { id: "vc-23", situation: "Opponent serving tough to your #6 (deep middle).",                        options: ["Leave her in spot", "Shift #1 to cover her seam"], bestIndex: 1 },
  { id: "vc-24", situation: "Parent texts 'Hit harder!' mid-match.",                                   options: ["Check phone next set", "Phone away — deal with it after"], bestIndex: 1 },
  { id: "vc-25", situation: "Your middle just blocked 2 in a row. She's hot.",                         options: ["Keep going outside", "Run a quick — ride the wave"], bestIndex: 1 },
  { id: "vc-26", situation: "You're serving. Score is 1-0 set 1. No pressure.",                        options: ["Go easy — warm up", "Same commit as match point"], bestIndex: 1 },
  { id: "vc-27", situation: "You shanked the last 2 passes. Ball coming again.",                       options: ["Let libero take it", "Platform to target, call early"], bestIndex: 1 },
  { id: "vc-28", situation: "Coach calls a timeout. Team is panicking.",                               options: ["Wait for coach", "Bring eyes up + clap — set the tone"], bestIndex: 1 },
  { id: "vc-29", situation: "Opponent setter is small. You're middle blocker.",                        options: ["Respect tips/dumps", "Don't worry about her — she won't dump"], bestIndex: 0 },
  { id: "vc-30", situation: "You played a great match. You lost. Parent is frustrated.",               options: ["Defend yourself", "Thank them, decompress 20 min, talk later"], bestIndex: 1 },
  { id: "vc-31", situation: "Libero passes a perfect ball. Setter has options.",                        options: ["Always set middle", "Read the block, set the best matchup"], bestIndex: 1 },
  { id: "vc-32", situation: "You rolled your ankle in warm-up. Feels weird but walkable.",              options: ["Hide it", "Trainer + coach before match"], bestIndex: 1 },
];

export function callsForSport(sport: Sport): PlayCall[] {
  return sport === "wrestling" ? WRESTLING_CALLS : VOLLEYBALL_CALLS;
}

export const PLAY_CALL_ROUND_SIZE = 10;
export const PLAY_CALL_SECONDS = 7;
export const PLAY_CALL_BASE_XP = 5;
export const PLAY_CALL_PERFECT_BONUS = 25;

/**
 * Deterministic shuffle per round index so the same "round 3" always
 * shows the same calls — unless the pool grows. Same seed math as
 * trivia/scenarios for consistency.
 */
export function pickCallRound(sport: Sport, roundIndex: number): PlayCall[] {
  const pool = callsForSport(sport);
  const seed = roundIndex * 6151 + 53;
  const indices = pool.map((_, i) => i);
  let s = seed;
  for (let i = indices.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, PLAY_CALL_ROUND_SIZE).map((i) => pool[i]);
}

/**
 * Streak multiplier applied to (base + speed bonus). Matches the
 * athlete-side combo spirit — consecutive correct answers stack up.
 */
export function streakMultiplier(streak: number): number {
  if (streak >= 7) return 2.5;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

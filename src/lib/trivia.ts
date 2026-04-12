import type { Sport } from "../types";

export interface TriviaQuestion {
  question: string;
  choices: [string, string, string, string]; // always 4 choices
  answer: 0 | 1 | 2 | 3; // index of correct choice
  fact?: string; // fun fact shown after answering
}

// -----------------------------------------------------------------------------
// Wrestling trivia — rules, history, legends, Olympics, technique
// -----------------------------------------------------------------------------
export const WRESTLING_TRIVIA: TriviaQuestion[] = [
  // Rules & scoring
  { question: "How many points is a takedown worth in high school wrestling?", choices: ["1", "2", "3", "4"], answer: 1, fact: "College wrestling awards 3 points for a takedown, but high school awards 2." },
  { question: "How many points is an escape worth?", choices: ["1", "2", "3", "0"], answer: 0 },
  { question: "How many points is a reversal worth?", choices: ["1", "2", "3", "4"], answer: 1 },
  { question: "What is it called when you hold your opponent's shoulders to the mat for 2 seconds?", choices: ["Near fall", "Pin", "Takedown", "Technical fall"], answer: 1, fact: "A pin (or fall) immediately ends the match." },
  { question: "How many periods are in a standard high school wrestling match?", choices: ["2", "3", "4", "5"], answer: 1 },
  { question: "How long is each period in high school wrestling?", choices: ["1 minute", "2 minutes", "3 minutes", "4 minutes"], answer: 1 },
  { question: "What is a 'near fall' worth?", choices: ["1 point", "2 or 3 points", "4 points", "5 points"], answer: 1, fact: "2 points for holding near-fall 2 seconds, 3 points for 5 seconds." },
  { question: "What happens if no one gets a takedown in overtime?", choices: ["Coin toss", "Both wrestlers lose", "Riding time decides", "Sudden victory continues"], answer: 2, fact: "In college, the first tiebreaker is a sudden-victory period, then riding time can factor in." },
  { question: "What is a 'technical fall'?", choices: ["Coach throws in towel", "15-point lead", "Wrestler is injured", "Time runs out"], answer: 1, fact: "When a wrestler leads by 15 or more points, the match ends in a technical fall." },

  // Three positions
  { question: "What are the three starting positions in wrestling?", choices: ["Offense, defense, neutral", "Neutral, top, bottom", "Standing, kneeling, lying", "Attack, guard, clinch"], answer: 1 },
  { question: "In which position do both wrestlers start on their feet?", choices: ["Top", "Bottom", "Neutral", "Guard"], answer: 2 },
  { question: "Who chooses the starting position at the start of the 2nd period?", choices: ["The wrestler who scored more", "The winner of a coin toss", "The home wrestler", "The referee"], answer: 1 },

  // Weight classes
  { question: "How many weight classes are there in high school wrestling?", choices: ["10", "12", "14", "16"], answer: 2 },
  { question: "What is the lightest weight class in high school wrestling?", choices: ["95 lbs", "100 lbs", "106 lbs", "112 lbs"], answer: 2 },
  { question: "What is the heaviest weight class in high school wrestling called?", choices: ["Super heavyweight", "Heavyweight", "Unlimited", "285"], answer: 1 },

  // Techniques
  { question: "What is a 'sprawl' used to defend against?", choices: ["A headlock", "A takedown attempt", "A pin", "A reversal"], answer: 1, fact: "You sprawl by kicking your legs back and driving your hips down onto your opponent's head." },
  { question: "Which takedown involves grabbing both of your opponent's legs?", choices: ["Single leg", "Double leg", "Fireman's carry", "Duck under"], answer: 1 },
  { question: "What is 'pummeling'?", choices: ["Running drills", "Fighting for underhooks and inside position", "Throwing your opponent", "A type of pin"], answer: 1 },
  { question: "What move involves grabbing your opponent's arm and lifting them over your shoulders?", choices: ["Suplex", "Fireman's carry", "Headlock", "Hip toss"], answer: 1 },
  { question: "What is the most common escape from the bottom position?", choices: ["Granby roll", "Stand-up", "Switch", "Peterson roll"], answer: 1 },
  { question: "What does 'shooting' mean in wrestling?", choices: ["Throwing punches", "Attacking your opponent's legs for a takedown", "Leaving the mat", "Scoring a pin"], answer: 1 },

  // History & legends
  { question: "Who is considered the greatest college wrestling coach of all time?", choices: ["John Smith", "Cael Sanderson", "Dan Gable", "Tom Brands"], answer: 2, fact: "Dan Gable led Iowa to 15 NCAA titles and 21 Big Ten championships." },
  { question: "What was Cael Sanderson's college record at Iowa State?", choices: ["100-0", "159-0", "150-5", "180-1"], answer: 1, fact: "Sanderson went 159-0, winning 4 NCAA titles — the only undefeated 4x champion in Division I history." },
  { question: "Dan Gable's Olympic record in 1972 was remarkable because he:", choices: ["Won every match by pin", "Didn't give up a single point", "Competed with a broken neck", "Won in two different weight classes"], answer: 1 },
  { question: "Which university has won the most NCAA wrestling team titles?", choices: ["Iowa", "Penn State", "Oklahoma State", "Minnesota"], answer: 2, fact: "Oklahoma State has 34 titles, though Iowa and Penn State have dominated more recently." },
  { question: "What did Jordan Burroughs famously say about his mindset?", choices: ["Fear nothing", "All I see is gold", "Just win", "Never quit"], answer: 1 },
  { question: "Kyle Dake made history by winning NCAA titles in how many different weight classes?", choices: ["2", "3", "4", "5"], answer: 2, fact: "Dake won at 141, 149, 157, and 165 lbs — the first wrestler to win 4 NCAA titles at 4 different weights." },
  { question: "Who upset the previously unbeaten Alexander Karelin at the 2000 Olympics?", choices: ["Cael Sanderson", "Kurt Angle", "Rulon Gardner", "Dan Gable"], answer: 2, fact: "Rulon Gardner's 1-0 victory over Karelin is considered one of the greatest upsets in Olympic history." },
  { question: "Kurt Angle won his Olympic gold medal at the 1996 Games despite:", choices: ["A broken ankle", "A broken neck", "Being 40 years old", "Never wrestling in college"], answer: 1 },

  // Olympics & international
  { question: "Wrestling has been in the Olympics since which year?", choices: ["1896", "1920", "1948", "1964"], answer: 0, fact: "Wrestling was in the very first modern Olympics in Athens, 1896." },
  { question: "What are the two Olympic styles of wrestling?", choices: ["Folkstyle and freestyle", "Freestyle and Greco-Roman", "Sumo and freestyle", "Catch and Greco-Roman"], answer: 1 },
  { question: "In Greco-Roman wrestling, you cannot attack below the:", choices: ["Knees", "Waist", "Chest", "Neck"], answer: 1, fact: "Greco-Roman forbids holds below the waist, making throws and upper-body attacks essential." },
  { question: "What style of wrestling is competed in US high schools?", choices: ["Freestyle", "Greco-Roman", "Folkstyle", "Catch-as-catch-can"], answer: 2 },

  // General knowledge
  { question: "What does a wrestler typically wear during a match?", choices: ["Shorts and t-shirt", "Singlet", "Gi", "Rash guard"], answer: 1 },
  { question: "What is the circular area where wrestlers compete called?", choices: ["The ring", "The mat", "The cage", "The court"], answer: 1 },
  { question: "What color singlets typically represent the two competitors?", choices: ["Blue and white", "Red and green", "Red and blue", "Black and gold"], answer: 2 },
  { question: "What does 'riding time' measure?", choices: ["How long the match lasts", "Time on top controlling your opponent", "Time between periods", "Warm-up time"], answer: 1, fact: "In college wrestling, 1+ minute of net riding time earns a bonus point." },
  { question: "Which president of the United States was a college wrestler?", choices: ["Barack Obama", "Abraham Lincoln", "Donald Trump", "Theodore Roosevelt"], answer: 1, fact: "Lincoln was known as an outstanding wrestler in his youth in Illinois." },
  { question: "What does USAW stand for?", choices: ["United States Amateur Wrestling", "USA Wrestling", "US Association of Wrestling", "United Sports and Wrestling"], answer: 1 },
];

// -----------------------------------------------------------------------------
// Volleyball trivia — rules, history, legends, Olympics, technique
// -----------------------------------------------------------------------------
export const VOLLEYBALL_TRIVIA: TriviaQuestion[] = [
  // Rules & scoring
  { question: "How many players are on the court per team in indoor volleyball?", choices: ["4", "5", "6", "7"], answer: 2 },
  { question: "How many players are on the court per team in beach volleyball?", choices: ["2", "3", "4", "6"], answer: 0 },
  { question: "How many points does a team need to win a set (non-deciding)?", choices: ["15", "21", "25", "30"], answer: 2, fact: "Before 2008, sets were played to 30. Now it's 25, and you must win by 2." },
  { question: "The 5th (deciding) set is played to how many points?", choices: ["10", "15", "21", "25"], answer: 1 },
  { question: "What is 'rally scoring'?", choices: ["Only serving team scores", "A point on every rally regardless of serve", "First to 50 wins", "Bonus points for kills"], answer: 1, fact: "Rally scoring was adopted in 1999 to make matches more predictable in length." },
  { question: "How many times can a team touch the ball before sending it over the net?", choices: ["1", "2", "3", "4"], answer: 2 },
  { question: "Can the ball touch the net on a serve and still be in play?", choices: ["Yes", "No", "Only in beach", "Only in indoor"], answer: 0, fact: "The let serve rule was changed in 2001 — a serve that touches the net and goes over is legal." },
  { question: "What is a 'double hit' violation?", choices: ["Hitting the ball twice in a row", "Two players hitting at the same time", "Touching the net twice", "Serving twice"], answer: 0 },
  { question: "What happens when the receiving team wins the rally?", choices: ["They score and keep serving", "They score and rotate to serve", "They just get the ball", "No point is scored"], answer: 1, fact: "This is called a 'side-out' — the receiving team earns a point AND the serve." },

  // Positions
  { question: "What position is responsible for running the offense and distributing the ball?", choices: ["Libero", "Setter", "Outside hitter", "Middle blocker"], answer: 1 },
  { question: "What is unique about the libero position?", choices: ["They can't jump", "They wear a different color jersey", "They serve every rotation", "They play the entire front row"], answer: 1, fact: "The libero is a back-row defensive specialist who cannot attack above the net or serve in some leagues." },
  { question: "Which position typically does the most attacking from the left side?", choices: ["Setter", "Middle blocker", "Outside hitter", "Libero"], answer: 2 },
  { question: "What does a middle blocker primarily do?", choices: ["Serve", "Run quick attacks and block", "Set the ball", "Play defense"], answer: 1 },
  { question: "The opposite hitter plays across from which position?", choices: ["Libero", "Middle blocker", "Setter", "Outside hitter"], answer: 2 },

  // Rotations & gameplay
  { question: "When does a team rotate positions?", choices: ["Every set", "After winning a rally when receiving serve", "After every point", "Only at timeouts"], answer: 1 },
  { question: "How many rotations does each team go through before all players have served?", choices: ["3", "4", "5", "6"], answer: 3 },
  { question: "Which row can attack the ball above the net?", choices: ["Back row only", "Front row only", "Any row", "Only the setter's row"], answer: 1, fact: "Back-row players can attack but must jump from behind the 10-foot (3-meter) line." },

  // Techniques
  { question: "What is a 'kill' in volleyball?", choices: ["A serve that aces", "An attack that results in a point", "A block that wins a rally", "A dig that saves the ball"], answer: 1 },
  { question: "What is an 'ace'?", choices: ["A perfect set", "A serve that scores directly without being returned", "A 3-hit attack", "A block point"], answer: 1 },
  { question: "What is a 'dig'?", choices: ["Passing a hard-driven ball on defense", "Setting the ball high", "Serving underhand", "Rotating positions"], answer: 0 },
  { question: "What is the 'pepper' drill?", choices: ["A serving exercise", "Two players passing, setting, and hitting back and forth", "A blocking warm-up", "A sprint conditioning drill"], answer: 1 },
  { question: "What is a 'pancake'?", choices: ["A flat serve", "A one-handed dig where the hand slides flat under the ball", "A type of set", "A type of block"], answer: 1 },
  { question: "What is the 'butterfly drill' named after?", choices: ["The shape of the player movement pattern", "A butterfly stretch", "The coach who invented it", "The arm motion"], answer: 0 },
  { question: "What is a 'float serve'?", choices: ["A serve with no spin that moves unpredictably", "A high arcing serve", "A serve that barely clears the net", "A jump serve"], answer: 0 },
  { question: "What is a 'slide' attack?", choices: ["A quick attack by the middle behind the setter", "Sliding on the floor for a dig", "A back-row attack", "A setter dump"], answer: 0 },

  // History & legends
  { question: "Who invented volleyball?", choices: ["James Naismith", "William G. Morgan", "Karch Kiraly", "Flo Hyman"], answer: 1, fact: "Morgan invented it in 1895 at a YMCA in Holyoke, Massachusetts. It was originally called 'mintonette.'" },
  { question: "Volleyball was originally called:", choices: ["Netball", "Mintonette", "Volley tennis", "Air ball"], answer: 1 },
  { question: "In what year did volleyball become an Olympic sport?", choices: ["1936", "1952", "1964", "1976"], answer: 2, fact: "Indoor volleyball debuted at the 1964 Tokyo Olympics." },
  { question: "When was beach volleyball added to the Olympics?", choices: ["1988", "1992", "1996", "2000"], answer: 2, fact: "Beach volleyball debuted at the 1996 Atlanta Olympics." },
  { question: "Who is the only player to win Olympic gold in both indoor AND beach volleyball?", choices: ["Misty May-Treanor", "Kerri Walsh Jennings", "Karch Kiraly", "Logan Tom"], answer: 2, fact: "Kiraly won indoor gold in 1984 and 1988, then beach gold in 1996." },
  { question: "How many Olympic gold medals did Misty May-Treanor and Kerri Walsh Jennings win together?", choices: ["1", "2", "3", "4"], answer: 2, fact: "They won three consecutive golds: 2004, 2008, and 2012." },
  { question: "What country has the nickname 'Iron Hammer' for their legendary player Lang Ping?", choices: ["Japan", "Brazil", "China", "USA"], answer: 2 },
  { question: "Which country dominated men's volleyball in the 2000s?", choices: ["USA", "Russia", "Brazil", "Italy"], answer: 2, fact: "Brazil won Olympic gold in 2004 and 2016 and multiple World Championships." },

  // General knowledge
  { question: "What is the standard height of a men's volleyball net?", choices: ["7 ft 4 in", "7 ft 8 in", "7 ft 11⅝ in", "8 ft 2 in"], answer: 2, fact: "Men's net is 7 feet 11⅝ inches (2.43 m). Women's is 7 feet 4⅛ inches (2.24 m)." },
  { question: "What is the 10-foot line (3-meter line) used for?", choices: ["Determining serving area", "Marking back-row attack boundary", "Marking rotation positions", "Substitution zone"], answer: 1 },
  { question: "What does 'FIVB' stand for?", choices: ["Federation of Indoor Volleyball Bodies", "International Volleyball Federation", "Fédération Internationale de Volleyball", "Federal Institute of Volleyball Bureau"], answer: 2 },
  { question: "How many sets does a team need to win to take a match?", choices: ["2 of 3", "3 of 5", "4 of 7", "2 of 5"], answer: 1 },
  { question: "What year was the libero position introduced in international volleyball?", choices: ["1988", "1998", "2002", "2006"], answer: 1 },
  { question: "Where was the first recorded game of beach volleyball played?", choices: ["California", "Florida", "Hawaii", "Australia"], answer: 2, fact: "The first recorded beach volleyball game was at the Outrigger Canoe Club on Waikiki Beach in 1915." },
];

/** How many questions per trivia round */
export const TRIVIA_ROUND_SIZE = 5;

/** XP earned per correct answer */
export const XP_PER_CORRECT = 10;

/** Bonus XP for a perfect round (all correct) */
export const PERFECT_ROUND_BONUS = 15;

/**
 * Pick N random questions from the sport's pool, seeded by today's date
 * so replays on the same day get different questions but are reproducible.
 */
export function pickTriviaRound(
  sport: Sport,
  roundIndex: number
): TriviaQuestion[] {
  const pool =
    sport === "wrestling" ? WRESTLING_TRIVIA : VOLLEYBALL_TRIVIA;

  // Fisher–Yates shuffle with a simple deterministic seed
  const seed = roundIndex * 7919 + 31;
  const indices = pool.map((_, i) => i);
  let s = seed;
  for (let i = indices.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, TRIVIA_ROUND_SIZE).map((i) => pool[i]);
}

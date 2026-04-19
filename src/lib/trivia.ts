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
  { question: "What is a 'near fall' worth?", choices: ["1 point", "2, 3, or 4 points", "5 points", "6 points"], answer: 1, fact: "Under current NFHS folkstyle rules: 2 pts for 2 seconds, 3 pts for 5 seconds, and 4 pts added for longer/controlled near-fall." },
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

  // Rules deep cuts
  { question: "What is a 'stalling' warning given for?", choices: ["Not moving aggressively enough", "Staying on the edge of the mat", "Both of the above", "Talking to your coach"], answer: 2, fact: "Stalling can be called for avoiding action, fleeing the mat, or failing to improve a position." },
  { question: "How many stalling calls before the first penalty point is awarded?", choices: ["None — first call is a point", "One warning, then points", "Two warnings", "Three warnings"], answer: 1, fact: "Folkstyle: one warning, then 1, 1, 2, DQ on subsequent stalling calls." },
  { question: "What's the penalty for a wrestler who fails to make weight?", choices: ["Automatic loss of 1 point", "Forfeit of the match", "Moves up a weight", "5-pound deduction from next weigh-in"], answer: 1 },
  { question: "'Locked hands' penalty applies to the wrestler in which position?", choices: ["Neutral", "Top — the offensive wrestler", "Bottom — the defensive wrestler", "Either position"], answer: 1, fact: "The top wrestler can't lock hands, feet, or arms around the bottom wrestler's torso unless in a pinning combination." },
  { question: "What is 'match point' in wrestling?", choices: ["The final takedown", "The point that would win the match", "Any point scored in overtime", "The first point of the match"], answer: 1 },
  { question: "What is a 'dual meet'?", choices: ["Head-to-head team competition", "A match with two referees", "An exhibition match", "A tournament's finals"], answer: 0 },
  { question: "How many consecutive team points from one match is the maximum in a dual?", choices: ["3", "6", "8 (pin, tech, forfeit)", "10"], answer: 2, fact: "A pin, tech fall, or forfeit all count as 6 team points in most dual-meet scoring systems." },
  { question: "In a dual meet, how many weight classes are contested?", choices: ["10", "12", "13", "14"], answer: 3 },
  { question: "What's the scoring value of a 'major decision'?", choices: ["3 team points", "4 team points", "6 team points", "8 team points"], answer: 1, fact: "A major decision is a win by 8–14 points and is worth 4 team points in duals." },
  { question: "What point margin defines a 'regular decision' win?", choices: ["1–7 points", "8–14 points", "15+ points", "Any margin"], answer: 0 },

  // More techniques
  { question: "What's a 'half nelson'?", choices: ["A takedown", "An upper-body pinning move where you hook under one arm and behind the neck", "A type of escape", "A stance"], answer: 1 },
  { question: "What's the 'funk' position known for?", choices: ["Being stuck underneath", "Creative scrambling from unconventional positions", "Bottom standup", "A type of ride"], answer: 1, fact: "Funk wrestling emphasizes reversals and scoring from seemingly bad positions." },
  { question: "What's a 'high crotch'?", choices: ["A type of ride", "A single-leg takedown where you lift the leg high", "A type of sprawl", "A counter to a duck-under"], answer: 1 },
  { question: "What's an 'ankle pick'?", choices: ["A takedown grabbing just the ankle", "A stretching exercise", "A pin", "A reversal"], answer: 0 },
  { question: "'Tight waist + ankle' is a classic wrestling:", choices: ["Breakdown", "Stand-up", "Takedown", "Throw"], answer: 0, fact: "It's one of the most fundamental rides used to break an opponent down from their base." },
  { question: "What is the 'spladle'?", choices: ["A type of singlet", "A pinning combination", "A leg split", "A warm-up drill"], answer: 1 },
  { question: "What's a 'Peterson roll'?", choices: ["A breakfast", "A front-head escape roll", "A back arch throw", "A type of pin from top"], answer: 1 },
  { question: "What's a 'granby roll'?", choices: ["A hip-heist escape", "A shoulder roll escape from bottom", "A type of takedown", "A front-roll escape"], answer: 1 },
  { question: "What is 'chain wrestling'?", choices: ["Linking moves together fluidly", "Wrestling on outdoor chains", "Team relay format", "Wrestling with ankle weights"], answer: 0 },
  { question: "A 'suplex' is primarily scored by:", choices: ["Going off-mat", "Back exposure / near-fall after the throw", "Taking down to the mat from clinch", "Clinching only"], answer: 1 },

  // More history & legends
  { question: "Who was the first American to win an Olympic gold medal in wrestling?", choices: ["George Mehnert", "Frank Gotch", "Tom Brands", "Dan Hodge"], answer: 0 },
  { question: "The 'Dan Hodge Trophy' is awarded to:", choices: ["Best high school wrestler", "Best college wrestler of the year", "Best freestyle wrestler", "Best coach"], answer: 1, fact: "Named after Dan Hodge, legendary Oklahoma wrestler. It's the Heisman of college wrestling." },
  { question: "Which state is known for producing the most top high school wrestlers per capita?", choices: ["California", "Pennsylvania", "Iowa", "All three are top states"], answer: 3 },
  { question: "What is the nickname of Iowa's wrestling team?", choices: ["Cyclones", "Hawkeyes", "Panthers", "Golden Eagles"], answer: 1 },
  { question: "Who is 'The Bull' in wrestling?", choices: ["Kyle Snyder", "Jordan Burroughs", "Dave Schultz", "John Smith"], answer: 1 },
  { question: "John Smith won how many world/Olympic titles?", choices: ["4", "6", "8", "10"], answer: 1, fact: "Smith won 4 World Championships and 2 Olympic gold medals — 6 world-level titles total." },
  { question: "What school is Cael Sanderson the head coach of?", choices: ["Iowa State", "Oklahoma State", "Penn State", "Minnesota"], answer: 2 },
  { question: "'The Russian Tie' is a reference to what?", choices: ["A weight class in Russia", "A hand-control position", "An international competition", "A type of singlet"], answer: 1 },
  { question: "Who wrote the famous book 'A Wrestling Life'?", choices: ["Dan Gable", "Cael Sanderson", "John Smith", "Kurt Angle"], answer: 0 },
  { question: "What year did Jordan Burroughs win his first Olympic gold?", choices: ["2008", "2012", "2016", "2020"], answer: 1, fact: "Burroughs won gold in London 2012 and became one of the most decorated American wrestlers ever." },

  // International & freestyle
  { question: "In freestyle wrestling, how long is each period?", choices: ["1 minute", "2 minutes", "3 minutes", "4 minutes"], answer: 2 },
  { question: "In freestyle, a 'gut wrench' scores points by:", choices: ["Breaking the opponent down", "Rolling the opponent for back exposure", "Being a takedown only", "Riding time"], answer: 1 },
  { question: "What ends a freestyle or Greco-Roman match by 'technical superiority'?", choices: ["15-point lead", "10-point lead", "Pin", "6-point lead"], answer: 1, fact: "Freestyle ends at a 10-point lead; Greco-Roman ends at 8." },
  { question: "In international wrestling, what color of shoe lace is sometimes used to signify that a scoring move is complete?", choices: ["No lace rule", "Red", "Blue", "The lace rule was eliminated"], answer: 3 },
  { question: "Which country has historically been the most dominant in freestyle wrestling?", choices: ["USA", "Iran", "Soviet Union / Russia", "Turkey"], answer: 2 },

  // Conditioning & training
  { question: "What's the purpose of 'live goes' in practice?", choices: ["Warm-up", "Full-contact match simulation", "Cooldown stretches", "Cardio sprints"], answer: 1 },
  { question: "What is 'cauliflower ear' caused by?", choices: ["Bacterial infection", "Trauma and blood pooling under ear cartilage", "Allergic reaction", "Genetics"], answer: 1, fact: "Headgear prevents it. Once formed, draining promptly prevents permanent disfigurement." },
  { question: "Most wrestlers' stance emphasizes:", choices: ["Tall and upright", "Low level, hips down, knees bent", "Lunging forward", "Standing sideways"], answer: 1 },
  { question: "Before a match, 'shadow wrestling' is done to:", choices: ["Warm up movement patterns + sharpen timing", "Impress the opponent", "Score style points", "Mimic the opponent's style"], answer: 0 },
  { question: "What does 'out-of-bounds' result in during a match?", choices: ["Automatic loss", "Restart in the neutral position", "Restart in the same position in the center", "1 point to opponent"], answer: 2 },
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

  // Rules deep cuts
  { question: "How many timeouts does each team get per set?", choices: ["1", "2", "3", "Unlimited"], answer: 1, fact: "Each team gets 2 timeouts per set, each 30 seconds long." },
  { question: "What is a 'lift' violation?", choices: ["Pushing the ball up with open hands", "Holding or catching the ball even briefly during a contact", "Contact above the net", "A type of substitution"], answer: 1 },
  { question: "How many substitutions is a team allowed per set?", choices: ["3", "6", "10", "Unlimited"], answer: 1, fact: "6 subs per set in most rule sets, but the libero doesn't count." },
  { question: "What is the 'center line' rule?", choices: ["You cannot step fully across to the opponent's side", "Where serves must land", "The setter's area", "Where the libero plays"], answer: 0 },
  { question: "What happens if you touch the net during play?", choices: ["Automatic point for the other team", "Warning only", "Point if the contact interferes with the play", "Nothing — it's legal"], answer: 2, fact: "Only net contact that affects the play (not incidental hair/jersey) is called." },
  { question: "What is a 'reverse coin toss'?", choices: ["The coin flipped by the away team", "Used in deciding 5th-set start side", "A player rotation method", "Doesn't exist"], answer: 3 },
  { question: "Can a libero set from the front court with their hands?", choices: ["Yes, always", "No — a front-row teammate can't attack that ball above the net", "Only if outside the attack line", "Only during serve receive"], answer: 1, fact: "Front-row player can't attack above the net off a libero's overhand set from in front of the 3m line." },
  { question: "What is a 'prolonged contact' violation?", choices: ["Holding the ball", "Serving past the line", "Net contact", "Too many touches"], answer: 0 },
  { question: "Can you attack a serve?", choices: ["Yes, any time", "No — a served ball cannot be attacked from above the net on/inside the 3m line", "Only in beach volleyball", "Only as a kill"], answer: 1 },
  { question: "What is the 'overlap' rule?", choices: ["Players must be in correct rotational order when the serve is contacted", "Three hits on same side", "Too many front-row players", "Server foot faults"], answer: 0 },

  // More techniques
  { question: "What's a 'roll shot'?", choices: ["A hard-driven spike", "A soft, arcing attack over or around the block", "A backspin serve", "A jump float"], answer: 1 },
  { question: "What's a 'cut shot'?", choices: ["A cross-court spike at a sharp angle", "A soft shot down the line", "A tip into the middle", "A setter dump"], answer: 0 },
  { question: "What is a 'line shot'?", choices: ["Hit down the sideline", "Hit across the court", "Hit short", "Hit over the block's hands"], answer: 0 },
  { question: "What's a 'tool' attack?", choices: ["Using the block's hands to score out of bounds", "A precision tip", "A back-row attack", "A serve receive technique"], answer: 0, fact: "Smart hitters 'tool' the block — swing into the hands so the ball deflects out of bounds on their side." },
  { question: "What's the 'J stroke' used in?", choices: ["Serving", "Approach to a quick attack", "Defensive digging of a hard-driven ball", "Setting"], answer: 0 },
  { question: "What's a 'seam' in blocking terminology?", choices: ["The gap between two blockers", "Where the net meets the floor", "A type of attack line", "The server's body position"], answer: 0 },
  { question: "A 'shoot set' is:", choices: ["A very low, fast set to the outside", "A back-row setting", "A high set for a deep hitter", "A setter dump"], answer: 0, fact: "Shoot (also called a 'go') is a low, flat set designed for fast outside attacks." },
  { question: "What does 'free ball' mean?", choices: ["The opposing team passes the ball over without an attack", "A legal attack", "A ball given to the referee", "A served ball that hits the net"], answer: 0 },
  { question: "What's a 'down ball'?", choices: ["A standing hit with no jump", "A bad pass", "A block attempt", "A serve receive"], answer: 0 },
  { question: "What is a 'pipe' attack?", choices: ["A back-row attack from position 6", "A serve receive formation", "A setter dump", "A blocking position"], answer: 0, fact: "Pipe = straight back middle attack; huge weapon when outsides are blocked tight." },

  // More history & legends
  { question: "Who is Karch Kiraly known as in volleyball?", choices: ["The Greatest American Male Volleyball Player Ever", "A top coach only", "A beach-only legend", "A rookie star"], answer: 0 },
  { question: "The 'Flo Hyman Award' is given to athletes who embody:", choices: ["Dignity, spirit, and commitment to excellence", "Most kills in a season", "Best rookie", "Most blocks"], answer: 0, fact: "Named after US star Flo Hyman, who died tragically young but was known for character and courage." },
  { question: "Which country has produced the most Olympic medals in women's volleyball?", choices: ["USA", "Cuba", "Brazil", "Russia / Soviet Union"], answer: 3 },
  { question: "Kerri Walsh Jennings' partner Misty May-Treanor is also known for:", choices: ["Being from Los Angeles", "Coaching later in career", "Commentating", "All of the above"], answer: 3 },
  { question: "Which US collegiate conference has historically dominated women's volleyball?", choices: ["Big Ten", "Pac-12", "SEC", "ACC"], answer: 1, fact: "Pac-12 (now Pac-10/12) has produced the most NCAA women's volleyball champions historically." },
  { question: "What year did women's volleyball debut at the Olympics?", choices: ["1964", "1968", "1972", "1984"], answer: 0 },
  { question: "'The Chicken Wing' celebration was popularized by which US team?", choices: ["USA Men's Volleyball", "USA Women's Volleyball", "Brazilian Men's Team", "It's not a thing"], answer: 3 },
  { question: "Who coached the US Women's National Team to their first Olympic gold in indoor?", choices: ["Karch Kiraly", "Hugh McCutcheon", "Doug Beal", "Mick Haley"], answer: 0, fact: "Kiraly coached USA Women to gold in Tokyo 2020 after decades of coming up short." },
  { question: "What year was the first World Championship for men's volleyball?", choices: ["1949", "1952", "1960", "1970"], answer: 0 },
  { question: "Beach volleyball legend Sinjin Smith played for which country?", choices: ["Brazil", "USA", "Italy", "Australia"], answer: 1 },

  // Conditioning & training
  { question: "What does 'platform' refer to in volleyball?", choices: ["Arm position for forearm passing", "Where the setter stands", "A type of jump", "A warm-up drill"], answer: 0 },
  { question: "Which muscle group is most engaged during a spike?", choices: ["Biceps only", "Core and hip rotation", "Quads only", "Forearms only"], answer: 1, fact: "Power in a spike comes from hip rotation through the core, not arm strength alone." },
  { question: "What's a 'shag' in volleyball practice?", choices: ["Picking up balls after drills", "A slow warm-up", "A type of jump", "A blocking drill"], answer: 0 },
  { question: "The 'approach' refers to:", choices: ["Running footwork pattern leading into a jump to attack", "The serve setup", "Walking to the court", "The handshake line"], answer: 0 },
  { question: "A 4-step approach is typically:", choices: ["Left-right-left-right", "Step-step-plant-jump (for a right-hander: L-R-L-R)", "Four small shuffle steps", "Back-side-back-side"], answer: 1 },
  { question: "What is 'shuffle footwork'?", choices: ["Quick lateral steps without crossing feet — used for passing", "A fancy attack step", "A serve routine", "A block footwork drill"], answer: 0 },
  { question: "Why do blockers 'press' over the net?", choices: ["To look intimidating", "To deflect the ball down into the opponent's court", "To block vision", "To touch the net"], answer: 1 },
  { question: "What's the purpose of a 'swing block'?", choices: ["A fancy block name", "Using a running/step-close approach to get more height and lateral reach", "Swinging at the ball as a block", "A beach-only technique"], answer: 1 },
  { question: "Why do teams 'pass to target'?", choices: ["Aesthetics", "So the setter has options for all three front-row attackers", "To slow down the game", "It's just a habit"], answer: 1 },
  { question: "What's 'reading the hitter'?", choices: ["Watching the hitter's body to predict where they'll attack", "Memorizing stats", "Pre-scouting report", "Reading the scouting book"], answer: 0, fact: "Defenders watch shoulder and arm position mid-approach to anticipate the attack direction." },
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

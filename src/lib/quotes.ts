import type { Sport } from "../types";

export interface Quote {
  text: string;
  author?: string;
}

// -----------------------------------------------------------------------------
// Wrestling — every quote is attributed to an actual wrestler or wrestling coach.
// -----------------------------------------------------------------------------
export const WRESTLING_QUOTES: Quote[] = [
  // Dan Gable — 1972 Olympic gold, Iowa dynasty coach
  { text: "Once you've wrestled, everything in life is easy.", author: "Dan Gable" },
  { text: "Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts.", author: "Dan Gable" },
  { text: "If it's important to you, you will find a way. If not, you will find an excuse.", author: "Dan Gable" },
  { text: "More enduringly than any other sport, wrestling teaches self-control and pride.", author: "Dan Gable" },
  { text: "The first period is won by the best technician. The second period is won by the kid in best shape. The third period is won by the kid with the biggest heart.", author: "Dan Gable" },
  { text: "Focus on the process, not the outcome.", author: "Dan Gable" },
  { text: "Mindset decides who will quit and who will win.", author: "Dan Gable" },
  { text: "Pain is nothing compared to what it feels like to quit.", author: "Dan Gable" },
  { text: "I'm a big believer in starting with high standards and raising them. We make progress only when we push ourselves to the highest level.", author: "Dan Gable" },
  { text: "A lot of my intensity in wrestling was due to my mental preparation before the matches.", author: "Dan Gable" },
  { text: "You can't ever work too much, because there's no such thing as being in too good of condition.", author: "Dan Gable" },

  // Cael Sanderson — undefeated NCAA champion, Penn State head coach
  { text: "Success is about consistently pushing yourself to be better than you were yesterday.", author: "Cael Sanderson" },
  { text: "The art of wrestling is finding the balance between discipline and creativity.", author: "Cael Sanderson" },
  { text: "Stay present, stay sharp, stay hungry.", author: "Cael Sanderson" },
  { text: "Confidence comes from being prepared. Confidence also comes from gratitude and humility.", author: "Cael Sanderson" },
  { text: "Focus on exactly what you can control — the way you're thinking, and what you can do with your hands and your feet.", author: "Cael Sanderson" },
  { text: "Be the best version of yourself and wrestle with gratitude and enthusiasm.", author: "Cael Sanderson" },
  { text: "If you're winning, chop wood, carry water.", author: "Cael Sanderson" },
  { text: "You can win this thing on one leg, but it's going to be hard to do that on one leg and with a bad attitude.", author: "Cael Sanderson" },

  // John Smith — 6x world champion, Oklahoma State coach
  { text: "The mental battle is the hardest battle to win.", author: "John Smith" },
  { text: "Control your thoughts and you control your match.", author: "John Smith" },

  // Jordan Burroughs — Olympic gold, 4x world champion
  { text: "The comeback is always stronger than the setback.", author: "Jordan Burroughs" },
  { text: "You have to be willing to sacrifice temporary comfort for long-term success.", author: "Jordan Burroughs" },
  { text: "Wrestling teaches you nothing comes without hard work.", author: "Jordan Burroughs" },
  { text: "All I see is gold.", author: "Jordan Burroughs" },

  // Kyle Dake — Olympic medalist, 4x NCAA champion in 4 weights
  { text: "The difference between good and great isn't talent. It's what you do on Tuesday at 6 a.m. when no one's counting.", author: "Kyle Dake" },
  { text: "The strongest athlete is the one who stays mentally tough.", author: "Kyle Dake" },

  // Henry Cejudo — Olympic gold, UFC champion
  { text: "Dream big, but out-work your dreams.", author: "Henry Cejudo" },

  // Tom Brands — Iowa head coach, Olympic gold medalist
  { text: "The difference between a good wrestler and a great wrestler is mental toughness. The great ones push through pain, adversity, and doubt, and emerge victorious.", author: "Tom Brands" },

  // Kyle Snyder — Olympic gold, 3x world champion
  { text: "Wrestling isn't just a physical sport, it's a mental one too. You have to stay focused, stay disciplined, and stay hungry if you want to succeed.", author: "Kyle Snyder" },

  // Spencer Lee — 3x NCAA champion
  { text: "The Ironman taught me I just needed to believe in myself, and I could keep scoring points even on the best wrestlers in the country.", author: "Spencer Lee" },
  { text: "If you're the underdog, you've got something to prove. And if you're the number one guy, you've got something to prove that you are the number one guy.", author: "Spencer Lee" },

  // David Taylor — Olympic gold, world champion
  { text: "Visualization and positive self-talk are powerful tools. They help me build confidence and stay focused on my goals.", author: "David Taylor" },

  // Kurt Angle — Olympic gold medalist
  { text: "Wrestling prepares you for anything life throws your way.", author: "Kurt Angle" },

  // Rulon Gardner — Olympic gold medalist
  { text: "Every great wrestler knows the value of discipline.", author: "Rulon Gardner" },
  { text: "I grew up on a farm, and I always learned when you work, you go forward. You don't stop and say, 'Well, I'll take a break.' You always go forward and get the job done.", author: "Rulon Gardner" },
  { text: "The only limits we have are the ones we impose on ourselves.", author: "Rulon Gardner" },

  // Ben Askren — NCAA champion, world team member
  { text: "When I think of sports, I think of three things — honor, integrity, and toughness.", author: "Ben Askren" },
];

// -----------------------------------------------------------------------------
// Volleyball — every quote is attributed to an actual volleyball player or coach.
// -----------------------------------------------------------------------------
export const VOLLEYBALL_QUOTES: Quote[] = [
  // Karch Kiraly — 3x Olympic gold, widely regarded as GOAT; USA women's head coach
  { text: "We are all going to fall short. We have to use those losses to come back even stronger.", author: "Karch Kiraly" },
  { text: "There's nothing worse than the feeling of wishing you had another chance at a play because you weren't ready.", author: "Karch Kiraly" },
  { text: "You have to get knocked down before you know how to get back up.", author: "Karch Kiraly" },
  { text: "Physically I'm not as strong as I was, but I try to make up for it mentally.", author: "Karch Kiraly" },
  { text: "No volleyball play can begin without a serve, and the serve is the only technique that is totally under your control.", author: "Karch Kiraly" },
  { text: "It's a serve and pass game.", author: "Karch Kiraly" },
  { text: "The great teams figure out a way to win. Those are the gold medal winning teams.", author: "Karch Kiraly" },

  // Kerri Walsh Jennings — 3x Olympic gold (beach)
  { text: "Adversity, if you allow it to, will fortify you and make you the best you can be.", author: "Kerri Walsh Jennings" },
  { text: "The first step to victory is recognizing the obstacles.", author: "Kerri Walsh Jennings" },
  { text: "Champions are made in the off-season.", author: "Kerri Walsh Jennings" },
  { text: "Dream big, work hard, and never give up. The only limits are the ones you set for yourself.", author: "Kerri Walsh Jennings" },
  { text: "Confidence is not about knowing you will always succeed, but about knowing you can handle whatever comes your way.", author: "Kerri Walsh Jennings" },
  { text: "Confidence comes from the way you talk to yourself.", author: "Kerri Walsh Jennings" },
  { text: "Success isn't about avoiding adversity — it's about deciding you're going to outlast it.", author: "Kerri Walsh Jennings" },
  { text: "The love and the grace you have for yourself can make you a killer. It doesn't soften you, it makes you more lethal.", author: "Kerri Walsh Jennings" },
  { text: "There are only two options regarding commitment: you're either in or you're out.", author: "Kerri Walsh Jennings" },
  { text: "Beach volleyball is not for the weak minded. Work hard, push yourself out of your comfort zone, work your way up.", author: "Kerri Walsh Jennings" },

  // Misty May-Treanor — 3x Olympic gold (beach)
  { text: "As long as you keep at it, your dreams will happen.", author: "Misty May-Treanor" },
  { text: "All my life, I've dreamed in gold.", author: "Misty May-Treanor" },
  { text: "You have to have a passion for what you do. If you don't have a passion for volleyball, ask yourself why you're playing it.", author: "Misty May-Treanor" },
  { text: "Volleyball is the sport through which I express my talents. It involves relating, pushing, and encouraging your teammates.", author: "Misty May-Treanor" },
  { text: "Without the other players on the court, you won't win all by yourself. It's just really important to think about it in that aspect.", author: "Misty May-Treanor" },
  { text: "I hate to lose, even if it is against friends.", author: "Misty May-Treanor" },

  // Hugh McCutcheon — Olympic gold coach (USA men 2008, silver women 2012)
  { text: "Nobody's played the perfect game of volleyball yet, and it's sure as hell not going to happen today. Let's talk about process instead.", author: "Hugh McCutcheon" },
  { text: "Coaching is about finding a system that works for your players — getting them to play the best volleyball they're capable of for a long period of time.", author: "Hugh McCutcheon" },

  // Terry Pettit — legendary Nebraska head coach
  { text: "Great coaching begins with hope.", author: "Terry Pettit" },
  { text: "Great coaching is the belief that good things are going to happen.", author: "Terry Pettit" },
  { text: "Great coaching is more concerned with the process and less concerned with the outcome.", author: "Terry Pettit" },

  // John Kessel — USA Volleyball director of sport development
  { text: "The best ability is availability. Show up. Every. Single. Day.", author: "John Kessel" },

  // Jordan Larson — Olympic gold, longtime USA captain
  { text: "The best way to move forward is to never stop improving.", author: "Jordan Larson" },
  { text: "The greatest thing about team sports is that you're not in it alone.", author: "Jordan Larson" },

  // April Ross — Olympic gold (beach)
  { text: "Don't watch the scoreboard. Watch your feet. Watch your hands. Watch your breath. The rest follows.", author: "April Ross" },
  { text: "To be the best, you have to demand the best from yourself.", author: "April Ross" },

  // Logan Tom — 4x Olympian, USA legend
  { text: "Champions aren't made when the lights are on. They're made in the 5 a.m. gym, the rainy Tuesday practice, and the match where nothing goes right — but you keep digging.", author: "Logan Tom" },

  // Lang Ping — Olympic gold as both player and coach (China)
  { text: "The spirit of our team is not simply about winning the championship, but to give our best even when facing defeat.", author: "Lang Ping" },
  { text: "Rise up against all obstacles and continue with perseverance and passion.", author: "Lang Ping" },

  // Giba — Brazilian legend, Olympic gold
  { text: "I love volleyball. I love the atmosphere. And I love the adrenaline. It's what I will do all of my life.", author: "Giba" },

  // Jenia Grebennikov — World's best libero, Olympic gold (France)
  { text: "I prefer to get a gold medal with my team and not just the award for the best libero.", author: "Jenia Grebennikov" },

  // Paola Egonu — Italian superstar
  { text: "I won't allow anyone that doesn't know how it is to wake up every day and fight for something you truly believe in to take that dream away from me.", author: "Paola Egonu" },
  { text: "Live without regrets. Follow your instinct.", author: "Paola Egonu" },
];

/**
 * Returns a deterministic quote for the given date and sport. The same
 * date always returns the same quote so the "Quote of the Day" feels
 * consistent across reloads.
 */
export function getQuoteForDate(sport: Sport, dateISO: string): Quote {
  const quotes = sport === "wrestling" ? WRESTLING_QUOTES : VOLLEYBALL_QUOTES;
  // Days-since-epoch hash from YYYY-MM-DD
  const [y, m, d] = dateISO.split("-").map(Number);
  const daysSinceEpoch = Math.floor(
    Date.UTC(y, (m ?? 1) - 1, d ?? 1) / (1000 * 60 * 60 * 24)
  );
  const idx = ((daysSinceEpoch % quotes.length) + quotes.length) % quotes.length;
  return quotes[idx];
}

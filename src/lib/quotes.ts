import type { Sport } from "../types";

export interface Quote {
  text: string;
  author?: string;
}

export const WRESTLING_QUOTES: Quote[] = [
  // Dan Gable
  { text: "Once you've wrestled, everything else in life is easy.", author: "Dan Gable" },
  { text: "Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts.", author: "Dan Gable" },
  { text: "If it's important to you, you will find a way. If not, you will find an excuse.", author: "Dan Gable" },
  { text: "More enduringly than any other sport, wrestling teaches self-control and pride.", author: "Dan Gable" },
  { text: "The first period is won by the best technician. The second period is won by the kid in best shape. The third period is won by the kid with the biggest heart.", author: "Dan Gable" },
  { text: "Focus on the process, not the outcome.", author: "Dan Gable" },
  { text: "Mindset decides who will quit and who will win.", author: "Dan Gable" },

  // Cael Sanderson
  { text: "Success is about consistently pushing yourself to be better than you were yesterday.", author: "Cael Sanderson" },
  { text: "The art of wrestling is finding the balance between discipline and creativity.", author: "Cael Sanderson" },
  { text: "Stay present, stay sharp, stay hungry.", author: "Cael Sanderson" },

  // John Smith
  { text: "The mental battle is the hardest battle to win.", author: "John Smith" },
  { text: "Control your thoughts and you control your match.", author: "John Smith" },

  // Jordan Burroughs
  { text: "The comeback is always stronger than the setback.", author: "Jordan Burroughs" },
  { text: "You have to be willing to sacrifice temporary comfort for long-term success.", author: "Jordan Burroughs" },
  { text: "Wrestling teaches you nothing comes without hard work.", author: "Jordan Burroughs" },
  { text: "All I see is gold.", author: "Jordan Burroughs" },

  // Kyle Dake
  { text: "The difference between good and great isn't talent. It's what you do on Tuesday at 6 a.m. when no one's counting.", author: "Kyle Dake" },
  { text: "The strongest athlete is the one who stays mentally tough.", author: "Kyle Dake" },

  // Henry Cejudo
  { text: "Dream big, but out-work your dreams.", author: "Henry Cejudo" },

  // Muhammad Ali (wrestling-adjacent wisdom)
  { text: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'", author: "Muhammad Ali" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },

  // General wrestling wisdom
  { text: "Pain is temporary. Quitting lasts forever.", author: "Wrestling Proverb" },
  { text: "Wrestling is the one sport where you can't hide. You are alone on that mat.", author: "Unknown" },
  { text: "A wrestler's greatest opponent is himself.", author: "Unknown" },
  { text: "There are no shortcuts to the top of the podium.", author: "Unknown" },
  { text: "Wrestling isn't about who's bigger or stronger — it's about who wants it more.", author: "Unknown" },
  { text: "Six minutes of fury, a lifetime of discipline.", author: "Unknown" },
  { text: "When the going gets tough, the tough wrestle harder.", author: "Unknown" },
  { text: "The wrestler who loses is the one who gives up, not the one who falls down.", author: "Unknown" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "Champions are made when no one is watching.", author: "Unknown" },
  { text: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Practice doesn't make perfect. Perfect practice makes perfect.", author: "Vince Lombardi" },
  { text: "The only easy day was yesterday.", author: "U.S. Navy SEALs" },
  { text: "A champion is someone who gets up when he can't.", author: "Jack Dempsey" },
  { text: "Respect all, fear none.", author: "Wrestling Motto" },
  { text: "Leave it all on the mat.", author: "Wrestling Motto" },
  { text: "Train like a beast, look like a beauty, act like a lady, think like a boss, wrestle like a champion.", author: "Unknown" },
];

export const VOLLEYBALL_QUOTES: Quote[] = [
  // Karch Kiraly
  { text: "We are all going to fall short. We have to use those losses to come back even stronger.", author: "Karch Kiraly" },
  { text: "There's nothing worse than the feeling of wishing you had another chance at a play because you weren't ready.", author: "Karch Kiraly" },
  { text: "You have to get knocked down before you know how to get back up.", author: "Karch Kiraly" },

  // Kerri Walsh Jennings
  { text: "Adversity, if you allow it to, will fortify you and make you the best you can be.", author: "Kerri Walsh Jennings" },
  { text: "The first step to victory is recognizing the obstacles.", author: "Kerri Walsh Jennings" },
  { text: "Champions are made in the off-season.", author: "Kerri Walsh Jennings" },

  // Misty May-Treanor
  { text: "As long as you keep at it, your dreams will happen.", author: "Misty May-Treanor" },
  { text: "It's important to get away from your sport until you miss it.", author: "Misty May-Treanor" },

  // Flo Hyman
  { text: "You have to dream big and have the dream big inside of you.", author: "Flo Hyman" },

  // John Kessel (USA Volleyball)
  { text: "The best ability is availability. Show up. Every. Single. Day.", author: "John Kessel" },

  // General volleyball wisdom
  { text: "Teamwork is the beauty of our sport, where you have six acting as one. You become selfless.", author: "Unknown" },
  { text: "Mental toughness is when you can find fuel in an empty tank.", author: "Unknown" },
  { text: "There's only a half step difference between champions and those who finish on the bottom. And much of that half step is mental.", author: "Unknown" },
  { text: "A great volleyball player has a short memory.", author: "Unknown" },
  { text: "In volleyball, the ball never lies.", author: "Unknown" },
  { text: "You need to work as hard to be a great teammate as you do to be a great player.", author: "Unknown" },
  { text: "The best block is a good pass.", author: "Unknown" },
  { text: "Volleyball is a sport of errors. The team with the fewest errors wins.", author: "Unknown" },
  { text: "One ball, one team, one heartbeat.", author: "Unknown" },
  { text: "The net is your best friend and your worst enemy.", author: "Unknown" },
  { text: "You can't win a championship without serving and passing.", author: "Unknown" },
  { text: "Pass like a pro, set like a surgeon, hit like a hammer.", author: "Unknown" },
  { text: "Our teamwork makes the dream work.", author: "Unknown" },
  { text: "A setter is only as good as her hitters — and a hitter is only as good as her setter.", author: "Unknown" },
  { text: "Defense wins championships.", author: "Unknown" },
  { text: "No amount of talent trumps hard work.", author: "Unknown" },

  // Cross-sport classics (still apply to volleyball)
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "It's not the hours you put in, but what you put in the hours.", author: "Unknown" },
  { text: "The more you sweat in practice, the less you bleed in battle.", author: "Unknown" },
  { text: "Don't be afraid to fail. Be afraid not to try.", author: "Michael Jordan" },
  { text: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi" },
  { text: "Practice doesn't make perfect. Perfect practice makes perfect.", author: "Vince Lombardi" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Great players are willing to give up their own personal achievement for the achievement of the group.", author: "Kareem Abdul-Jabbar" },
  { text: "Talent wins games, but teamwork and intelligence win championships.", author: "Michael Jordan" },
  { text: "Every champion was once a beginner who refused to give up.", author: "Unknown" },
  { text: "The will to win is nothing without the will to prepare.", author: "Juma Ikangaa" },
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

import type { Sport } from "../types";

export interface BibleVerse {
  reference: string;
  text: string;
}

export interface Quote {
  text: string;
  author?: string;
  verse: BibleVerse;
}

// -----------------------------------------------------------------------------
// Wrestling — every quote is attributed to an actual wrestler or wrestling coach.
// Each quote is paired with a thematically matching Bible verse.
// -----------------------------------------------------------------------------
export const WRESTLING_QUOTES: Quote[] = [
  // Dan Gable — 1972 Olympic gold, Iowa dynasty coach
  {
    text: "Once you've wrestled, everything in life is easy.",
    author: "Dan Gable",
    verse: { reference: "James 1:2-4", text: "Consider it pure joy whenever you face trials, because the testing of your faith produces perseverance." },
  },
  {
    text: "Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts.",
    author: "Dan Gable",
    verse: { reference: "Colossians 3:23", text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters." },
  },
  {
    text: "If it's important to you, you will find a way. If not, you will find an excuse.",
    author: "Dan Gable",
    verse: { reference: "Proverbs 16:3", text: "Commit to the Lord whatever you do, and he will establish your plans." },
  },
  {
    text: "More enduringly than any other sport, wrestling teaches self-control and pride.",
    author: "Dan Gable",
    verse: { reference: "Galatians 5:22-23", text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control." },
  },
  {
    text: "The first period is won by the best technician. The second period is won by the kid in best shape. The third period is won by the kid with the biggest heart.",
    author: "Dan Gable",
    verse: { reference: "Hebrews 12:1", text: "Let us run with perseverance the race marked out for us." },
  },
  {
    text: "Focus on the process, not the outcome.",
    author: "Dan Gable",
    verse: { reference: "1 Corinthians 9:24", text: "Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize." },
  },
  {
    text: "Mindset decides who will quit and who will win.",
    author: "Dan Gable",
    verse: { reference: "2 Timothy 1:7", text: "For the Spirit God gave us does not make us timid, but gives us power, love, and self-discipline." },
  },
  {
    text: "Pain is nothing compared to what it feels like to quit.",
    author: "Dan Gable",
    verse: { reference: "Galatians 6:9", text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up." },
  },
  {
    text: "I'm a big believer in starting with high standards and raising them. We make progress only when we push ourselves to the highest level.",
    author: "Dan Gable",
    verse: { reference: "Philippians 3:14", text: "I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus." },
  },
  {
    text: "A lot of my intensity in wrestling was due to my mental preparation before the matches.",
    author: "Dan Gable",
    verse: { reference: "Proverbs 21:31", text: "The horse is made ready for the day of battle, but victory rests with the Lord." },
  },
  {
    text: "You can't ever work too much, because there's no such thing as being in too good of condition.",
    author: "Dan Gable",
    verse: { reference: "Ecclesiastes 9:10", text: "Whatever your hand finds to do, do it with all your might." },
  },

  // Cael Sanderson — undefeated NCAA champion, Penn State head coach
  {
    text: "Success is about consistently pushing yourself to be better than you were yesterday.",
    author: "Cael Sanderson",
    verse: { reference: "Philippians 3:13-14", text: "Forgetting what is behind and straining toward what is ahead, I press on toward the goal." },
  },
  {
    text: "The art of wrestling is finding the balance between discipline and creativity.",
    author: "Cael Sanderson",
    verse: { reference: "1 Corinthians 9:27", text: "I discipline my body like an athlete, training it to do what it should." },
  },
  {
    text: "Stay present, stay sharp, stay hungry.",
    author: "Cael Sanderson",
    verse: { reference: "Matthew 5:6", text: "Blessed are those who hunger and thirst for righteousness, for they will be filled." },
  },
  {
    text: "Confidence comes from being prepared. Confidence also comes from gratitude and humility.",
    author: "Cael Sanderson",
    verse: { reference: "1 Peter 5:6", text: "Humble yourselves under the mighty hand of God, that he may lift you up in due time." },
  },
  {
    text: "Focus on exactly what you can control — the way you're thinking, and what you can do with your hands and your feet.",
    author: "Cael Sanderson",
    verse: { reference: "Philippians 4:8", text: "Whatever is true, whatever is noble, whatever is right, whatever is pure — think about such things." },
  },
  {
    text: "Be the best version of yourself and wrestle with gratitude and enthusiasm.",
    author: "Cael Sanderson",
    verse: { reference: "1 Thessalonians 5:18", text: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus." },
  },
  {
    text: "If you're winning, chop wood, carry water.",
    author: "Cael Sanderson",
    verse: { reference: "Philippians 2:3", text: "Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves." },
  },
  {
    text: "You can win this thing on one leg, but it's going to be hard to do that on one leg and with a bad attitude.",
    author: "Cael Sanderson",
    verse: { reference: "Philippians 2:5", text: "In your relationships with one another, have the same mindset as Christ Jesus." },
  },

  // John Smith — 6x world champion, Oklahoma State coach
  {
    text: "The mental battle is the hardest battle to win.",
    author: "John Smith",
    verse: { reference: "2 Corinthians 10:5", text: "We take captive every thought to make it obedient to Christ." },
  },
  {
    text: "Control your thoughts and you control your match.",
    author: "John Smith",
    verse: { reference: "Romans 12:2", text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind." },
  },

  // Jordan Burroughs — Olympic gold, 4x world champion
  {
    text: "The comeback is always stronger than the setback.",
    author: "Jordan Burroughs",
    verse: { reference: "Proverbs 24:16", text: "For though the righteous fall seven times, they rise again." },
  },
  {
    text: "You have to be willing to sacrifice temporary comfort for long-term success.",
    author: "Jordan Burroughs",
    verse: { reference: "Hebrews 12:11", text: "No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace." },
  },
  {
    text: "Wrestling teaches you nothing comes without hard work.",
    author: "Jordan Burroughs",
    verse: { reference: "Proverbs 14:23", text: "All hard work brings a profit, but mere talk leads only to poverty." },
  },
  {
    text: "All I see is gold.",
    author: "Jordan Burroughs",
    verse: { reference: "Philippians 3:14", text: "I press on toward the goal to win the prize for which God has called me heavenward." },
  },

  // Kyle Dake — Olympic medalist, 4x NCAA champion in 4 weights
  {
    text: "The difference between good and great isn't talent. It's what you do on Tuesday at 6 a.m. when no one's counting.",
    author: "Kyle Dake",
    verse: { reference: "Matthew 6:4", text: "So that your giving may be in secret. Then your Father, who sees what is done in secret, will reward you." },
  },
  {
    text: "The strongest athlete is the one who stays mentally tough.",
    author: "Kyle Dake",
    verse: { reference: "Ephesians 6:10", text: "Be strong in the Lord and in his mighty power." },
  },

  // Henry Cejudo — Olympic gold, UFC champion
  {
    text: "Dream big, but out-work your dreams.",
    author: "Henry Cejudo",
    verse: { reference: "Proverbs 21:5", text: "The plans of the diligent lead to profit as surely as haste leads to poverty." },
  },

  // Tom Brands — Iowa head coach, Olympic gold medalist
  {
    text: "The difference between a good wrestler and a great wrestler is mental toughness. The great ones push through pain, adversity, and doubt, and emerge victorious.",
    author: "Tom Brands",
    verse: { reference: "Joshua 1:9", text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." },
  },

  // Kyle Snyder — Olympic gold, 3x world champion
  {
    text: "Wrestling isn't just a physical sport, it's a mental one too. You have to stay focused, stay disciplined, and stay hungry if you want to succeed.",
    author: "Kyle Snyder",
    verse: { reference: "1 Corinthians 9:27", text: "I discipline my body like an athlete, training it to do what it should." },
  },

  // Spencer Lee — 3x NCAA champion
  {
    text: "The Ironman taught me I just needed to believe in myself, and I could keep scoring points even on the best wrestlers in the country.",
    author: "Spencer Lee",
    verse: { reference: "Mark 9:23", text: "Everything is possible for one who believes." },
  },
  {
    text: "If you're the underdog, you've got something to prove. And if you're the number one guy, you've got something to prove that you are the number one guy.",
    author: "Spencer Lee",
    verse: { reference: "2 Timothy 4:7", text: "I have fought the good fight, I have finished the race, I have kept the faith." },
  },

  // David Taylor — Olympic gold, world champion
  {
    text: "Visualization and positive self-talk are powerful tools. They help me build confidence and stay focused on my goals.",
    author: "David Taylor",
    verse: { reference: "Philippians 4:8", text: "Whatever is true, whatever is noble, whatever is right, whatever is pure — think about such things." },
  },

  // Kurt Angle — Olympic gold medalist
  {
    text: "Wrestling prepares you for anything life throws your way.",
    author: "Kurt Angle",
    verse: { reference: "Ephesians 6:13", text: "Put on the full armor of God, so that when the day of evil comes, you may be able to stand your ground." },
  },

  // Rulon Gardner — Olympic gold medalist
  {
    text: "Every great wrestler knows the value of discipline.",
    author: "Rulon Gardner",
    verse: { reference: "Hebrews 12:11", text: "No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace." },
  },
  {
    text: "I grew up on a farm, and I always learned when you work, you go forward. You don't stop and say, 'Well, I'll take a break.' You always go forward and get the job done.",
    author: "Rulon Gardner",
    verse: { reference: "Proverbs 13:4", text: "A sluggard's appetite is never filled, but the desires of the diligent are fully satisfied." },
  },
  {
    text: "The only limits we have are the ones we impose on ourselves.",
    author: "Rulon Gardner",
    verse: { reference: "Matthew 17:20", text: "If you have faith as small as a mustard seed, you can say to this mountain, 'Move from here to there,' and it will move. Nothing will be impossible for you." },
  },

  // Ben Askren — NCAA champion, world team member
  {
    text: "When I think of sports, I think of three things — honor, integrity, and toughness.",
    author: "Ben Askren",
    verse: { reference: "Proverbs 10:9", text: "Whoever walks in integrity walks securely, but whoever takes crooked paths will be found out." },
  },
];

// -----------------------------------------------------------------------------
// Volleyball — every quote is attributed to an actual volleyball player or coach.
// Each quote is paired with a thematically matching Bible verse.
// -----------------------------------------------------------------------------
export const VOLLEYBALL_QUOTES: Quote[] = [
  // Karch Kiraly — 3x Olympic gold, widely regarded as GOAT; USA women's head coach
  {
    text: "We are all going to fall short. We have to use those losses to come back even stronger.",
    author: "Karch Kiraly",
    verse: { reference: "Proverbs 24:16", text: "For though the righteous fall seven times, they rise again." },
  },
  {
    text: "There's nothing worse than the feeling of wishing you had another chance at a play because you weren't ready.",
    author: "Karch Kiraly",
    verse: { reference: "1 Peter 3:15", text: "Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have." },
  },
  {
    text: "You have to get knocked down before you know how to get back up.",
    author: "Karch Kiraly",
    verse: { reference: "2 Corinthians 4:8-9", text: "We are hard pressed on every side, but not crushed; struck down, but not destroyed." },
  },
  {
    text: "Physically I'm not as strong as I was, but I try to make up for it mentally.",
    author: "Karch Kiraly",
    verse: { reference: "2 Corinthians 12:10", text: "For when I am weak, then I am strong." },
  },
  {
    text: "No volleyball play can begin without a serve, and the serve is the only technique that is totally under your control.",
    author: "Karch Kiraly",
    verse: { reference: "Galatians 6:5", text: "Each one should carry their own load." },
  },
  {
    text: "It's a serve and pass game.",
    author: "Karch Kiraly",
    verse: { reference: "Matthew 7:24", text: "Everyone who hears these words of mine and puts them into practice is like a wise man who built his house on the rock." },
  },
  {
    text: "The great teams figure out a way to win. Those are the gold medal winning teams.",
    author: "Karch Kiraly",
    verse: { reference: "Romans 8:37", text: "In all these things we are more than conquerors through him who loved us." },
  },

  // Kerri Walsh Jennings — 3x Olympic gold (beach)
  {
    text: "Adversity, if you allow it to, will fortify you and make you the best you can be.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "Romans 5:3-4", text: "We know that suffering produces perseverance; perseverance, character; and character, hope." },
  },
  {
    text: "The first step to victory is recognizing the obstacles.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "Proverbs 22:3", text: "The prudent see danger and take refuge, but the simple keep going and pay the penalty." },
  },
  {
    text: "Champions are made in the off-season.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "Matthew 6:6", text: "When you pray, go into your room, close the door and pray to your Father, who is unseen. Then your Father, who sees what is done in secret, will reward you." },
  },
  {
    text: "Dream big, work hard, and never give up. The only limits are the ones you set for yourself.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "Galatians 6:9", text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up." },
  },
  {
    text: "Confidence is not about knowing you will always succeed, but about knowing you can handle whatever comes your way.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
  },
  {
    text: "Confidence comes from the way you talk to yourself.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "Proverbs 18:21", text: "The tongue has the power of life and death." },
  },
  {
    text: "Success isn't about avoiding adversity — it's about deciding you're going to outlast it.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "James 1:12", text: "Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life." },
  },
  {
    text: "The love and the grace you have for yourself can make you a killer. It doesn't soften you, it makes you more lethal.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "2 Corinthians 12:9", text: "My grace is sufficient for you, for my power is made perfect in weakness." },
  },
  {
    text: "There are only two options regarding commitment: you're either in or you're out.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "Matthew 6:24", text: "No one can serve two masters. Either you will hate the one and love the other, or you will be devoted to the one and despise the other." },
  },
  {
    text: "Beach volleyball is not for the weak minded. Work hard, push yourself out of your comfort zone, work your way up.",
    author: "Kerri Walsh Jennings",
    verse: { reference: "Joshua 1:9", text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." },
  },

  // Misty May-Treanor — 3x Olympic gold (beach)
  {
    text: "As long as you keep at it, your dreams will happen.",
    author: "Misty May-Treanor",
    verse: { reference: "Hebrews 10:36", text: "You need to persevere so that when you have done the will of God, you will receive what he has promised." },
  },
  {
    text: "All my life, I've dreamed in gold.",
    author: "Misty May-Treanor",
    verse: { reference: "Proverbs 29:18", text: "Where there is no vision, the people perish." },
  },
  {
    text: "You have to have a passion for what you do. If you don't have a passion for volleyball, ask yourself why you're playing it.",
    author: "Misty May-Treanor",
    verse: { reference: "Colossians 3:23", text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters." },
  },
  {
    text: "Volleyball is the sport through which I express my talents. It involves relating, pushing, and encouraging your teammates.",
    author: "Misty May-Treanor",
    verse: { reference: "1 Peter 4:10", text: "Each of you should use whatever gift you have received to serve others, as faithful stewards of God's grace." },
  },
  {
    text: "Without the other players on the court, you won't win all by yourself. It's just really important to think about it in that aspect.",
    author: "Misty May-Treanor",
    verse: { reference: "Ecclesiastes 4:9-10", text: "Two are better than one. If either of them falls down, one can help the other up." },
  },
  {
    text: "I hate to lose, even if it is against friends.",
    author: "Misty May-Treanor",
    verse: { reference: "1 Corinthians 9:24", text: "Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize." },
  },

  // Hugh McCutcheon — Olympic gold coach (USA men 2008, silver women 2012)
  {
    text: "Nobody's played the perfect game of volleyball yet, and it's sure as hell not going to happen today. Let's talk about process instead.",
    author: "Hugh McCutcheon",
    verse: { reference: "Philippians 1:6", text: "He who began a good work in you will carry it on to completion until the day of Christ Jesus." },
  },
  {
    text: "Coaching is about finding a system that works for your players — getting them to play the best volleyball they're capable of for a long period of time.",
    author: "Hugh McCutcheon",
    verse: { reference: "Mark 10:45", text: "For even the Son of Man did not come to be served, but to serve." },
  },

  // Terry Pettit — legendary Nebraska head coach
  {
    text: "Great coaching begins with hope.",
    author: "Terry Pettit",
    verse: { reference: "Romans 15:13", text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit." },
  },
  {
    text: "Great coaching is the belief that good things are going to happen.",
    author: "Terry Pettit",
    verse: { reference: "Hebrews 11:1", text: "Now faith is confidence in what we hope for and assurance about what we do not see." },
  },
  {
    text: "Great coaching is more concerned with the process and less concerned with the outcome.",
    author: "Terry Pettit",
    verse: { reference: "Zechariah 4:10", text: "Who dares despise the day of small things?" },
  },

  // John Kessel — USA Volleyball director of sport development
  {
    text: "The best ability is availability. Show up. Every. Single. Day.",
    author: "John Kessel",
    verse: { reference: "Galatians 6:9", text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up." },
  },

  // Jordan Larson — Olympic gold, longtime USA captain
  {
    text: "The best way to move forward is to never stop improving.",
    author: "Jordan Larson",
    verse: { reference: "Philippians 3:13-14", text: "Forgetting what is behind and straining toward what is ahead, I press on toward the goal." },
  },
  {
    text: "The greatest thing about team sports is that you're not in it alone.",
    author: "Jordan Larson",
    verse: { reference: "Ecclesiastes 4:9", text: "Two are better than one, because they have a good return for their labor." },
  },

  // April Ross — Olympic gold (beach)
  {
    text: "Don't watch the scoreboard. Watch your feet. Watch your hands. Watch your breath. The rest follows.",
    author: "April Ross",
    verse: { reference: "Matthew 6:34", text: "Do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own." },
  },
  {
    text: "To be the best, you have to demand the best from yourself.",
    author: "April Ross",
    verse: { reference: "1 Corinthians 10:31", text: "So whether you eat or drink or whatever you do, do it all for the glory of God." },
  },

  // Logan Tom — 4x Olympian, USA legend
  {
    text: "Champions aren't made when the lights are on. They're made in the 5 a.m. gym, the rainy Tuesday practice, and the match where nothing goes right — but you keep digging.",
    author: "Logan Tom",
    verse: { reference: "Matthew 6:4", text: "So that your giving may be in secret. Then your Father, who sees what is done in secret, will reward you." },
  },

  // Lang Ping — Olympic gold as both player and coach (China)
  {
    text: "The spirit of our team is not simply about winning the championship, but to give our best even when facing defeat.",
    author: "Lang Ping",
    verse: { reference: "2 Timothy 4:7", text: "I have fought the good fight, I have finished the race, I have kept the faith." },
  },
  {
    text: "Rise up against all obstacles and continue with perseverance and passion.",
    author: "Lang Ping",
    verse: { reference: "Hebrews 12:1", text: "Let us run with perseverance the race marked out for us." },
  },

  // Giba — Brazilian legend, Olympic gold
  {
    text: "I love volleyball. I love the atmosphere. And I love the adrenaline. It's what I will do all of my life.",
    author: "Giba",
    verse: { reference: "Nehemiah 8:10", text: "The joy of the Lord is your strength." },
  },

  // Jenia Grebennikov — World's best libero, Olympic gold (France)
  {
    text: "I prefer to get a gold medal with my team and not just the award for the best libero.",
    author: "Jenia Grebennikov",
    verse: { reference: "Philippians 2:3", text: "Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves." },
  },

  // Paola Egonu — Italian superstar
  {
    text: "I won't allow anyone that doesn't know how it is to wake up every day and fight for something you truly believe in to take that dream away from me.",
    author: "Paola Egonu",
    verse: { reference: "Isaiah 40:31", text: "Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary." },
  },
  {
    text: "Live without regrets. Follow your instinct.",
    author: "Paola Egonu",
    verse: { reference: "James 1:5", text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you." },
  },
];

/**
 * Returns a deterministic quote for the given date and sport. The same
 * date always returns the same quote so the "Quote of the Day" feels
 * consistent across reloads. The paired Bible verse rotates in lock-step.
 */
export function getQuoteForDate(sport: Sport, dateISO: string): Quote {
  const quotes = sport === "wrestling" ? WRESTLING_QUOTES : VOLLEYBALL_QUOTES;
  const [y, m, d] = dateISO.split("-").map(Number);
  const daysSinceEpoch = Math.floor(
    Date.UTC(y, (m ?? 1) - 1, d ?? 1) / (1000 * 60 * 60 * 24)
  );
  const idx = ((daysSinceEpoch % quotes.length) + quotes.length) % quotes.length;
  return quotes[idx];
}

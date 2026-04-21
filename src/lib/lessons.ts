import type { Sport } from "../types";

export interface LessonSection {
  heading: string;
  body: string;
}

export interface MentalLesson {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  durationMin: number;
  xp: number;
  category: "mindset" | "confidence" | "pressure" | "focus" | "identity";
  sections: LessonSection[];
  reflectionPrompt: string;
}

export function lessonsForSport(sport: Sport): MentalLesson[] {
  const vb = sport === "volleyball";
  return [
    {
      id: "growth-mindset",
      title: "Growth vs. Fixed Mindset",
      subtitle: "How you view talent changes everything",
      emoji: "🌱",
      durationMin: 5,
      xp: 25,
      category: "mindset",
      sections: [
        {
          heading: "The two mindsets",
          body: "A FIXED mindset says: 'I'm either good at this or I'm not. Talent is set.' A GROWTH mindset says: 'Abilities can be developed with effort and good practice.' Research by Dr. Carol Dweck at Stanford found growth-minded athletes outperform fixed-minded athletes over time — by a lot.",
        },
        {
          heading: "How to spot it in yourself",
          body: vb
            ? "FIXED talk: 'I'm just not a good serve-receiver.' / 'I'll never beat that team.' / 'I'm not a natural.' GROWTH talk: 'I haven't figured out serve-receive YET.' / 'I haven't beaten them YET.' / 'I'm building it.' The word YET is the smallest, most powerful change you can make."
            : "FIXED talk: 'I'm just not a good takedown defender.' / 'I'll never beat that kid.' / 'I'm not a natural.' GROWTH talk: 'I haven't figured out takedown defense YET.' / 'I haven't beaten him YET.' / 'I'm building it.' The word YET is the smallest, most powerful change you can make.",
        },
        {
          heading: "Why it matters",
          body: "Fixed-mindset athletes avoid challenges (because failure = proof they're not good). Growth-mindset athletes seek challenges (because failure = data for improvement). Who do you want to be — someone who protects an image, or someone who keeps growing?",
        },
        {
          heading: "Practice it today",
          body: "Catch one fixed thought today. Add 'YET' to the end. Then ask: what would someone who believes they can grow do next? Go do that.",
        },
      ],
      reflectionPrompt:
        "What's one fixed-mindset thought you've had about your sport? Rewrite it with a growth mindset.",
    },
    {
      id: "self-talk",
      title: "Self-Talk & Reframing",
      subtitle: "Become your own best coach",
      emoji: "🗣️",
      durationMin: 5,
      xp: 25,
      category: "mindset",
      sections: [
        {
          heading: "You are always talking to yourself",
          body: "You have about 12,000-60,000 thoughts per day, and research suggests up to 80% are negative by default. Every athlete has an inner voice. The best athletes have trained that voice to be a coach, not a critic.",
        },
        {
          heading: "Three types of self-talk",
          body: vb
            ? "1) INSTRUCTIONAL — 'Platform to target.' 'High reach.' Useful during technical execution. 2) MOTIVATIONAL — 'Let's go.' 'One more.' Useful when energy is fading. 3) REFRAMING — turning 'I'm nervous' into 'I'm energized.' Same feeling, different story."
            : "1) INSTRUCTIONAL — 'Keep your hips down.' 'Short arm.' Useful during technical execution. 2) MOTIVATIONAL — 'Let's go.' 'One more.' Useful when energy is fading. 3) REFRAMING — turning 'I'm nervous' into 'I'm energized.' Same feeling, different story.",
        },
        {
          heading: "The second-person trick",
          body: "Research shows talking to yourself in second person ('You've got this, [your name]') is more effective than first person ('I've got this'). Feels weird. Works. Try it in your next match.",
        },
        {
          heading: "Your go-to phrase",
          body: vb
            ? "Every great athlete has a POWER PHRASE — a short line they repeat under pressure. Kerri Walsh Jennings says 'I'm fearless.' What's yours? Something short, present-tense, and true to who you're becoming."
            : "Every great athlete has a POWER PHRASE — a short line they repeat under pressure. Jordan Burroughs says 'All I see is gold.' What's yours? Something short, present-tense, and true to who you're becoming.",
        },
      ],
      reflectionPrompt:
        "Write your POWER PHRASE. Say it out loud three times before you go to sleep tonight.",
    },
    {
      id: "pressure",
      title: "Handling Pressure",
      subtitle: "Why your best athletes want the ball",
      emoji: "🔥",
      durationMin: 5,
      xp: 25,
      category: "pressure",
      sections: [
        {
          heading: "Pressure isn't the enemy",
          body: "Pressure means you care. It means what you're doing matters. The goal isn't to eliminate pressure — it's to reframe your relationship to it. Elite athletes say they LOVE big moments. Why? Because they've trained to see them differently.",
        },
        {
          heading: "Threat vs. challenge",
          body: "Same situation, two different brains: THREAT brain says 'I might fail. I might lose respect.' Leads to tight muscles, shallow breathing, bad decisions. CHALLENGE brain says 'This is what I trained for. Let's see what I've got.' Leads to focus, energy, clear thinking.",
        },
        {
          heading: "Focus on process, not outcome",
          body: "Outcome thinking ('I need to win this') creates pressure. Process thinking ('I need to execute my next move well') creates focus. Champions compete on process. They trust the result will follow.",
        },
        {
          heading: "Before the big moment",
          body: "Three tools: 1) DEEP BREATH (literally slow your heart rate). 2) SHRINK THE MOMENT ('Just this next play. Just this next shot.'). 3) SMILE (research shows even a fake smile reduces stress hormones).",
        },
      ],
      reflectionPrompt:
        "Think of a pressure moment ahead. Write what your CHALLENGE brain would say about it.",
    },
    {
      id: "mistake-recovery",
      title: "Mistake Recovery",
      subtitle: "The one-play reset",
      emoji: "🔄",
      durationMin: 4,
      xp: 20,
      category: "focus",
      sections: [
        {
          heading: "Every athlete makes mistakes",
          body: "Michael Jordan missed over 9,000 shots. Karch Kiraly shanked countless passes. The difference between great athletes and average ones isn't fewer mistakes — it's FASTER RECOVERY from them.",
        },
        {
          heading: "The FLUSH technique",
          body: vb
            ? "F — FEEL it briefly (don't suppress — honesty matters). L — LEARN one thing (2 seconds max). U — USE a physical reset (clap, wrist snap, slap the floor). S — SHIFT to the next play. H — HOLD that new focus. From mistake to ready in under 5 seconds."
            : "F — FEEL it briefly (don't suppress — honesty matters). L — LEARN one thing (2 seconds max). U — USE a physical reset (clap, wrist snap, touch the mat). S — SHIFT to the next play. H — HOLD that new focus. From mistake to ready in under 5 seconds.",
        },
        {
          heading: "Why physical matters",
          body: vb
            ? "A physical action (clap, breathe, tap) sends a signal to your brain: 'That moment is OVER.' Without it, the brain can loop the mistake. Ever noticed a hitter slap the floor after a shank? That's the reset."
            : "A physical action (clap, breathe, tap) sends a signal to your brain: 'That moment is OVER.' Without it, the brain can loop the mistake. Ever noticed a wrestler shake their hands after a bad round? That's the reset.",
        },
        {
          heading: "Short memory, long memory",
          body: "Short memory during the match (forget mistakes fast). Long memory after the match (remember the lesson). Log what you learned in your post-match reflection. Then let it go.",
        },
      ],
      reflectionPrompt:
        "Pick a physical reset cue you'll use. Practice it three times right now.",
    },
    {
      id: "focus",
      title: "Focus Training",
      subtitle: "Control your attention, control your game",
      emoji: "🎯",
      durationMin: 5,
      xp: 25,
      category: "focus",
      sections: [
        {
          heading: "Attention is a muscle",
          body: "The best athletes can focus on one thing for long periods without getting pulled away by distractions — the crowd, the score, the ref's calls. That ability is trainable.",
        },
        {
          heading: "Narrow vs. broad focus",
          body: vb
            ? "NARROW focus = one specific thing (the ball, the hitter's shoulder). BROAD focus = the whole picture (the whole court, reading the setter). You need both. The skill is knowing when to switch."
            : "NARROW focus = one specific thing (the opponent's hip, your tie). BROAD focus = the whole picture (the whole mat, reading the opponent). You need both. The skill is knowing when to switch.",
        },
        {
          heading: "The 5-4-3-2-1 reset",
          body: "When your mind wanders during a break: name 5 things you can see, 4 you can hear, 3 you can feel, 2 you can smell, 1 you can taste. Brings you back to the present instantly.",
        },
        {
          heading: "Triggers and cues",
          body: "Create a cue that flips you into focus mode — a tap on your chest, a single word, a breath pattern. Use the same cue every time. Over weeks, it becomes a switch: cue → focus, automatic.",
        },
      ],
      reflectionPrompt:
        "What's your focus cue? Describe when and how you'll use it.",
    },
    {
      id: "identity",
      title: "Who You Are When You Compete",
      subtitle: "Identity drives behavior",
      emoji: "👤",
      durationMin: 4,
      xp: 20,
      category: "identity",
      sections: [
        {
          heading: "Behavior follows identity",
          body: "If you think 'I'm trying to be a good athlete,' you'll show up when it's easy. If you think 'I AM an athlete — this is who I am,' you'll show up even when it's hard. Small shift in words. Huge shift in behavior.",
        },
        {
          heading: "The athlete you're becoming",
          body: "Write down: 'I am the kind of athlete who _____.' Finish it with 3-5 things. 'Who never skips reps.' 'Who watches film on off days.' 'Who treats teammates with respect.' This is your identity statement. Read it before practice.",
        },
        {
          heading: "Every action is a vote",
          body: "James Clear (Atomic Habits): every action is a vote for the kind of person you're becoming. Going to bed at 10 is a vote for a high performer. Scrolling until 1am is a vote for someone who underperforms. Cast your votes carefully.",
        },
        {
          heading: "No one-day identities",
          body: "You can't build identity in a single day. But if you show up as the athlete you're becoming every day for 90 days, you become that person. Game day tells the truth about who you are — and who you're becoming.",
        },
      ],
      reflectionPrompt:
        "Complete: 'I am the kind of athlete who _____.' Write three finishes. Put it somewhere you'll see daily.",
    },
    {
      id: "confidence",
      title: "Building Confidence",
      subtitle: "Earned belief, not arrogance",
      emoji: "💎",
      durationMin: 4,
      xp: 20,
      category: "confidence",
      sections: [
        {
          heading: "Confidence is a byproduct",
          body: "You don't fake your way into confidence. You earn it — through preparation, reps, and small wins you can count on. The athlete with the most confidence isn't the loudest; it's usually the one who has done the most unseen work.",
        },
        {
          heading: "Three sources of confidence",
          body: vb
            ? "1) MASTERY — stuff you've already done well ('I've hit 50 jump serves in a row in practice'). 2) MODELING — seeing others like you succeed. 3) VERBAL PERSUASION — what you and trusted people tell you ('You've done the work'). Stack all three."
            : "1) MASTERY — stuff you've already done well ('I've hit 50 double-legs clean in practice'). 2) MODELING — seeing others like you succeed. 3) VERBAL PERSUASION — what you and trusted people tell you ('You've done the work'). Stack all three.",
        },
        {
          heading: "Keep a wins log",
          body: "At the end of each week, write 3 things you did well. Not outcomes — PROCESS wins. 'I got to practice on time every day.' 'I asked coach a question.' 'I did my visualization on Thursday.' Over a season, this log becomes irrefutable proof of who you're becoming.",
        },
        {
          heading: "Humility + confidence",
          body: "The strongest athletes are humble AND confident. Humble: there's more to learn, always. Confident: I've earned my place here. Not cockiness. Quiet, unshakeable belief.",
        },
      ],
      reflectionPrompt:
        "Write 3 process wins from the last 7 days. These are your evidence.",
    },
  ];
}

export function getLesson(id: string, sport: Sport): MentalLesson | undefined {
  return lessonsForSport(sport).find((l) => l.id === id);
}

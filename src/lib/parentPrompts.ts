/**
 * Catalog of weekly conversation prompts a parent can use to talk to
 * their athlete. The goal: give parents a good opener so the
 * post-practice check-in isn't a shrug. Questions are intentionally
 * open-ended, non-judgmental, and age-appropriate.
 *
 * Not meant to be exhaustive or therapeutic — it's a nudge, not a
 * script. Parents are encouraged to use them as starters and let the
 * conversation drift from there.
 *
 * Selection is deterministic per ISO-week so a parent sees the same
 * prompt all week, then it rotates. If they don't like this week's,
 * they can cycle to the next one via `nextPromptForWeek`.
 */

export interface ParentPrompt {
  id: string;
  /** The literal question to ask the athlete. */
  question: string;
  /** One-sentence hint shown below the question for the parent. */
  why: string;
}

export const PARENT_PROMPTS: ParentPrompt[] = [
  {
    id: "surprise",
    question: "What did you surprise yourself with this week?",
    why: "Invites them to notice a win they didn't predict.",
  },
  {
    id: "hardest",
    question: "What was the hardest part of practice this week?",
    why: "Opens a door without demanding a specific feeling.",
  },
  {
    id: "teammate",
    question:
      "Name one teammate who pushed you this week — what did they do?",
    why: "Turns the lens outward; makes gratitude and attention concrete.",
  },
  {
    id: "coach-said",
    question: "What's something your coach said that stuck with you?",
    why: "Shows them their coach's words are worth remembering.",
  },
  {
    id: "click",
    question: "What's something that finally clicked for you?",
    why: "Names a growth moment so it doesn't slip by.",
  },
  {
    id: "redo",
    question: "If you could redo one moment this week, what would it be?",
    why: "Reflection without blame — it's about curiosity.",
  },
  {
    id: "look-forward",
    question: "What are you most looking forward to next week?",
    why: "Keeps their eyes up. Great after a rough week.",
  },
  {
    id: "lucky",
    question: "Who do you feel lucky to train with?",
    why: "Gratitude + identity in one. Answers often surprise parents.",
  },
  {
    id: "proud-quiet",
    question:
      "What's something you did this week that nobody noticed, but you're proud of?",
    why: "Some of the best work is invisible. Name it.",
  },
  {
    id: "confidence",
    question: "What's one thing that made you feel confident this week?",
    why: "Builds their awareness of what fuels their best self.",
  },
  {
    id: "nervous",
    question: "What made you most nervous this week — and what did you do?",
    why: "Names the fear + honors the response.",
  },
  {
    id: "body",
    question: "How's your body feeling? What needs rest, what's strong?",
    why: "Kids don't always know what to name. Prompt it.",
  },
  {
    id: "tough-moment",
    question:
      "What's one moment this week where you wanted to quit but didn't?",
    why: "Grit is worth naming out loud.",
  },
  {
    id: "better-at",
    question: "What do you think you're getting better at?",
    why: "Builds internal narrative of improvement.",
  },
  {
    id: "still-working",
    question: "What are you still working on?",
    why: "Normalizes being a work in progress.",
  },
  {
    id: "scared-of",
    question: "Is there anything about your sport you're scared of right now?",
    why: "Only ask if it feels right. Listen more than respond.",
  },
  {
    id: "fun",
    question: "When did practice feel the most fun this week?",
    why: "Reminds them (and you) why they started.",
  },
  {
    id: "new-thing",
    question: "What's something new you tried this week?",
    why: "Courage lives in new things. Spotlight it.",
  },
  {
    id: "teammate-tough",
    question:
      "Did anyone have a tough week that you noticed? How did you show up for them?",
    why: "Grows empathy by asking about theirs.",
  },
  {
    id: "water-sleep",
    question: "What's one thing that helped you recover well this week?",
    why: "Normalizes recovery as training, not downtime.",
  },
  {
    id: "self-talk",
    question:
      "What were you telling yourself during the hardest part of this week?",
    why: "Builds awareness of inner voice.",
  },
  {
    id: "rule",
    question:
      "If you could make one rule for your team, what would it be?",
    why: "Playful framing for values and character.",
  },
  {
    id: "role-model",
    question: "Who's been a good example to you lately?",
    why: "Not always a coach or pro. Often a teammate.",
  },
  {
    id: "missed",
    question: "Is there a practice or habit you wish you hadn't missed?",
    why: "Regret without shame — plan differently next time.",
  },
  {
    id: "one-word",
    question: "If you had one word for your week, what would it be?",
    why: "Good warmup for deeper talk.",
  },
  {
    id: "replay",
    question: "What's the moment you'd most want to put on a highlight reel?",
    why: "Fun. Builds positive memory.",
  },
  {
    id: "focus",
    question: "What's your one thing to focus on next week?",
    why: "Helps them commit out loud.",
  },
  {
    id: "help",
    question: "What's one way I could support you better this week?",
    why: "Shifts the dynamic from inspector to teammate.",
  },
  {
    id: "fuel",
    question: "What's a food or meal that makes you feel strong?",
    why: "Builds body awareness without weight talk.",
  },
  {
    id: "gratitude",
    question: "What are you grateful for this week — sport-related or not?",
    why: "Widen the lens. Kids sometimes forget the basics.",
  },
];

/**
 * Deterministic selection based on ISO week. Same week → same prompt,
 * rotating through the catalog over weeks.
 */
export function promptForWeek(
  weekMondayIso: string,
  offset = 0
): ParentPrompt {
  // Convert the date to "weeks since epoch" for a stable integer.
  const epochWeek = Math.floor(
    new Date(weekMondayIso + "T00:00:00").getTime() /
      (7 * 24 * 60 * 60 * 1000)
  );
  const idx =
    ((epochWeek + offset) % PARENT_PROMPTS.length + PARENT_PROMPTS.length) %
    PARENT_PROMPTS.length;
  return PARENT_PROMPTS[idx];
}

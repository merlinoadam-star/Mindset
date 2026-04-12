/**
 * Character personas for text-to-speech. Each persona picks from the
 * system voices available via Web Speech API and applies custom rate,
 * pitch, and signature intro phrases to give it personality.
 *
 * Important: these are archetypes — not celebrity voice clones. Using
 * actual named celebrity / character voices (e.g. "Buzz Lightyear",
 * "Randy Savage") without a license would be copyright/trademark
 * infringement. The archetype names below evoke a vibe but are legally
 * distinct.
 */

export interface SpeechPersona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rate: number; // 0.1–10, system default 1
  pitch: number; // 0–2, system default 1
  introPhrases?: string[]; // one is prepended randomly before the text
  outroPhrases?: string[]; // one is appended randomly after the text
  /** Strategy for picking a Web Speech voice from what's installed. */
  voiceMatch: {
    /** Preferred gender — filters voice list, best-effort. */
    gender?: "male" | "female" | "any";
    /** Case-insensitive regex fragments to prefer in voice.name. */
    prefer?: string[];
    /** Fragments to avoid in voice.name. */
    avoid?: string[];
    /** Language prefix, default "en". */
    lang?: string;
  };
}

export const PERSONAS: SpeechPersona[] = [
  {
    id: "natural",
    name: "Natural",
    emoji: "🎙️",
    description: "Clean, clear, no extras",
    rate: 0.95,
    pitch: 1,
    voiceMatch: { gender: "any", lang: "en" },
  },
  {
    id: "champ",
    name: "The Champ",
    emoji: "🏆",
    description: "Confident, swagger, big moments",
    rate: 0.85,
    pitch: 0.85,
    introPhrases: ["Champ here.", "Listen up.", "Pay attention, fighter."],
    outroPhrases: ["Float like a butterfly.", "Stay ready."],
    voiceMatch: {
      gender: "male",
      prefer: ["daniel", "alex", "fred", "ralph"],
      lang: "en",
    },
  },
  {
    id: "coach",
    name: "The Coach",
    emoji: "🎯",
    description: "Gruff, motivational, no-nonsense",
    rate: 0.9,
    pitch: 0.8,
    introPhrases: [
      "Alright, kid, listen.",
      "Hey — pay attention now.",
      "Let's go over this.",
    ],
    outroPhrases: ["Now get to work.", "You got it? Good. Go."],
    voiceMatch: {
      gender: "male",
      prefer: ["daniel", "ralph", "alex"],
      lang: "en",
    },
  },
  {
    id: "warrior",
    name: "The Warrior",
    emoji: "⚔️",
    description: "Loud, dramatic, ring-ready",
    rate: 0.95,
    pitch: 0.75,
    introPhrases: ["OH YEAH!", "LET'S. GO.", "Lemme tell ya something..."],
    outroPhrases: ["DIG it!", "OH YEAAAHH!"],
    voiceMatch: {
      gender: "male",
      prefer: ["daniel", "ralph", "fred"],
      lang: "en",
    },
  },
  {
    id: "explorer",
    name: "The Explorer",
    emoji: "🗺️",
    description: "Cheerful, adventurous, friend",
    rate: 1.05,
    pitch: 1.25,
    introPhrases: [
      "¡Hola, friend!",
      "Let's go on an adventure!",
      "Hi, amigo!",
    ],
    outroPhrases: ["¡Buen trabajo!", "We did it!", "¡Vámonos!"],
    voiceMatch: {
      gender: "female",
      prefer: ["samantha", "karen", "tessa", "google us english"],
      lang: "en",
    },
  },
  {
    id: "space-ranger",
    name: "The Space Ranger",
    emoji: "🚀",
    description: "Heroic, brave, out-of-this-world",
    rate: 1.0,
    pitch: 1.1,
    introPhrases: [
      "To greatness — and beyond!",
      "Onward, space cadet!",
      "This is the Space Ranger speaking.",
    ],
    outroPhrases: ["Mission accomplished.", "Keep the galaxy safe."],
    voiceMatch: {
      gender: "male",
      prefer: ["alex", "fred", "tom"],
      lang: "en",
    },
  },
  {
    id: "mentor",
    name: "The Mentor",
    emoji: "🧙",
    description: "Wise, calm, ancient wisdom",
    rate: 0.7,
    pitch: 0.9,
    introPhrases: [
      "Listen carefully, young one.",
      "Wisdom, I share with you.",
      "Hmm. Hear this.",
    ],
    outroPhrases: ["The Force be with you.", "Remember this, you will."],
    voiceMatch: {
      gender: "male",
      prefer: ["daniel", "thomas"],
      lang: "en",
    },
  },
  {
    id: "hype",
    name: "The Hype Squad",
    emoji: "🔥",
    description: "Electric, pumped up, your biggest fan",
    rate: 1.2,
    pitch: 1.15,
    introPhrases: [
      "YESSIR!",
      "LET'S GET IT!",
      "YO YO YO!",
      "Listen — this is HUGE:",
    ],
    outroPhrases: ["LEGGGO!", "That's FIRE!", "You already KNOW!"],
    voiceMatch: { gender: "any", lang: "en" },
  },
  {
    id: "announcer",
    name: "The Announcer",
    emoji: "🎤",
    description: "Sports arena PA — dramatic pause, big voice",
    rate: 0.88,
    pitch: 0.95,
    introPhrases: [
      "And NOW, ladies and gentlemen...",
      "Tonight's message:",
      "Coming in at center mat...",
    ],
    outroPhrases: ["...and THAT is the fact.", "Back to you in the studio."],
    voiceMatch: {
      gender: "male",
      prefer: ["alex", "daniel", "ralph"],
      lang: "en",
    },
  },
  {
    id: "robo-coach",
    name: "Robo-Coach",
    emoji: "🤖",
    description: "AI coach from the future",
    rate: 0.92,
    pitch: 0.65,
    introPhrases: [
      "Scanning... advice incoming.",
      "Initializing motivation protocol.",
      "Analyzing athlete data. Recommendation:",
    ],
    outroPhrases: [
      "End transmission.",
      "Next optimization: tomorrow.",
      "Beep. Boop.",
    ],
    voiceMatch: { gender: "any", lang: "en" },
  },
  {
    id: "captain",
    name: "The Captain",
    emoji: "⚓",
    description: "Team leader, steady, trustworthy",
    rate: 0.95,
    pitch: 0.95,
    introPhrases: [
      "Alright team, gather in.",
      "Captain here — listen up.",
      "Here's the plan:",
    ],
    outroPhrases: ["Together we win.", "On three: team."],
    voiceMatch: {
      gender: "any",
      prefer: ["samantha", "karen", "daniel", "alex"],
      lang: "en",
    },
  },
  {
    id: "best-friend",
    name: "The Best Friend",
    emoji: "🫂",
    description: "Warm, supportive, you've got this",
    rate: 1.0,
    pitch: 1.1,
    introPhrases: [
      "Hey, I believe in you.",
      "Just real quick —",
      "You know what? You're doing great.",
    ],
    outroPhrases: ["You got this.", "I'm in your corner.", "Proud of you."],
    voiceMatch: {
      gender: "female",
      prefer: ["samantha", "karen", "tessa"],
      lang: "en",
    },
  },
  {
    id: "random",
    name: "Random Surprise",
    emoji: "🎲",
    description: "Random persona each time — never know who you'll get!",
    rate: 1.0,
    pitch: 1,
    voiceMatch: { gender: "any", lang: "en" },
  },
];

export function getPersona(id: string | undefined | null): SpeechPersona {
  if (id === "random") {
    // Pick any persona EXCEPT random & natural for fun
    const pool = PERSONAS.filter((p) => p.id !== "random" && p.id !== "natural");
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

/**
 * Given the device's list of available voices, pick the best one for this
 * persona. Returns undefined to let the browser use its default.
 */
export function pickVoiceForPersona(
  persona: SpeechPersona,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const lang = (persona.voiceMatch.lang ?? "en").toLowerCase();
  const preferList = (persona.voiceMatch.prefer ?? []).map((p) => p.toLowerCase());
  const avoidList = (persona.voiceMatch.avoid ?? []).map((p) => p.toLowerCase());
  const wantGender = persona.voiceMatch.gender;

  const scored = voices
    .filter((v) => v.lang.toLowerCase().startsWith(lang))
    .map((v) => {
      const name = v.name.toLowerCase();
      let score = 0;
      // Strongly prefer names listed in persona.prefer
      for (const p of preferList) {
        if (name.includes(p)) score += 20;
      }
      // Avoid banned names
      for (const a of avoidList) {
        if (name.includes(a)) score -= 50;
      }
      // Heuristic gender matching (not perfect — browser voices don't
      // expose gender, but names are usually good enough)
      const maleNames = [
        "daniel", "alex", "fred", "ralph", "thomas", "aaron", "tom",
        "david", "mark", "nicky", "google us english male", "matthew",
        "microsoft mark", "microsoft david", "microsoft guy",
      ];
      const femaleNames = [
        "samantha", "karen", "tessa", "victoria", "moira", "veena",
        "zira", "eva", "serena", "susan", "microsoft zira",
        "microsoft eva", "microsoft susan", "google us english female",
      ];
      const looksMale = maleNames.some((n) => name.includes(n));
      const looksFemale = femaleNames.some((n) => name.includes(n));
      if (wantGender === "male") {
        if (looksMale) score += 10;
        else if (looksFemale) score -= 10;
      } else if (wantGender === "female") {
        if (looksFemale) score += 10;
        else if (looksMale) score -= 10;
      }
      // Slightly prefer en-US as a tiebreaker
      if (v.lang.toLowerCase().startsWith("en-us")) score += 2;
      // Default voices get a tiny nudge
      if (v.default) score += 1;
      return { voice: v, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.voice;
}

export function buildSpokenText(
  persona: SpeechPersona,
  text: string
): string {
  const pick = <T,>(arr: T[] | undefined): T | undefined =>
    arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
  const intro = pick(persona.introPhrases);
  const outro = pick(persona.outroPhrases);
  const parts: string[] = [];
  if (intro) parts.push(intro);
  parts.push(text);
  if (outro) parts.push(outro);
  return parts.join(" ... ");
}

import type {
  Sport,
  VolleyballPosition,
  WrestlingStyle,
} from "../types";

// -----------------------------------------------------------------------------
// Wrestling
// -----------------------------------------------------------------------------

/** Standard NFHS high school folkstyle weight classes (lbs). */
export const WRESTLING_WEIGHT_CLASSES_BOYS = [
  106, 113, 120, 126, 132, 138, 144, 150, 157, 165, 175, 190, 215, 285,
];

/** Standard NFHS girls' weight classes (lbs). */
export const WRESTLING_WEIGHT_CLASSES_GIRLS = [
  100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 155, 170, 190, 235,
];

export const WRESTLING_STYLE_LABELS: Record<WrestlingStyle, string> = {
  folkstyle: "Folkstyle",
  freestyle: "Freestyle",
  "greco-roman": "Greco-Roman",
};

/** Common tournaments youth and scholastic wrestlers attend / aim for. */
export const WRESTLING_TOURNAMENTS_SUGGESTIONS = [
  "District Tournament",
  "Regional Tournament",
  "Sectional Tournament",
  "State Tournament",
  "Super 32",
  "Ironman (Walsh Jesuit)",
  "Beast of the East",
  "Powerade Tournament",
  "Cheesehead Invitational",
  "FloNationals",
  "NHSCA Nationals",
  "USA Wrestling Folkstyle Nationals",
  "USA Wrestling Freestyle Nationals (Fargo)",
  "AAU Nationals",
  "Tulsa Nationals",
  "Reno Tournament of Champions",
];

/** Common awards a youth or HS wrestler might earn. */
export const WRESTLING_AWARDS_SUGGESTIONS = [
  "Team Captain",
  "Most Outstanding Wrestler",
  "Most Valuable Wrestler",
  "Most Improved",
  "Coach's Award",
  "Most Pins",
  "All-Conference",
  "All-District",
  "All-Region",
  "All-State",
  "All-American",
  "State Qualifier",
  "State Placer",
  "State Champion",
  "National Qualifier",
  "100-Win Club",
  "150-Win Club",
  "200-Win Club",
  "Academic All-Conference",
  "Scholar-Athlete",
];

// -----------------------------------------------------------------------------
// Volleyball
// -----------------------------------------------------------------------------

export const VOLLEYBALL_POSITION_LABELS: Record<VolleyballPosition, string> = {
  setter: "Setter",
  libero: "Libero",
  "middle-blocker": "Middle Blocker",
  "outside-hitter": "Outside Hitter",
  opposite: "Opposite / Right Side",
  "defensive-specialist": "Defensive Specialist (DS)",
};

export const VOLLEYBALL_POSITION_ORDER: VolleyballPosition[] = [
  "setter",
  "outside-hitter",
  "middle-blocker",
  "opposite",
  "libero",
  "defensive-specialist",
];

/** Common tournaments youth/club/HS volleyball players attend. */
export const VOLLEYBALL_TOURNAMENTS_SUGGESTIONS = [
  "Conference Tournament",
  "District Tournament",
  "Sectional Tournament",
  "Regional Tournament",
  "State Tournament",
  "AAU Nationals",
  "USA Volleyball Girls Junior Nationals (GJNC)",
  "USA Volleyball Boys Junior Nationals (BJNC)",
  "JVA World Challenge",
  "JVA Rock 'N Rumble",
  "MLK Showcase",
  "Triple Crown NIT",
  "Windy City National Qualifier",
  "Colorado Crossroads",
  "Bluegrass Classic",
  "Show Me National Qualifier",
  "Nike Tournament of Champions (TOC)",
  "Asics MEQ (Mideast Qualifier)",
  "Nike Nationals",
];

/** Common awards a youth or HS volleyball player might earn. */
export const VOLLEYBALL_AWARDS_SUGGESTIONS = [
  "Team Captain",
  "Most Valuable Player (MVP)",
  "Most Improved",
  "Offensive Player of the Year",
  "Defensive Player of the Year",
  "Libero of the Year",
  "Setter of the Year",
  "Coach's Award",
  "All-Tournament Team",
  "All-Conference",
  "All-District",
  "All-Region",
  "All-State",
  "All-American",
  "State Qualifier",
  "State Champion",
  "National Qualifier",
  "JVA All-American",
  "Academic All-Conference",
  "Scholar-Athlete",
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function tournamentsForSport(sport: Sport): string[] {
  return sport === "wrestling"
    ? WRESTLING_TOURNAMENTS_SUGGESTIONS
    : VOLLEYBALL_TOURNAMENTS_SUGGESTIONS;
}

export function awardsForSport(sport: Sport): string[] {
  return sport === "wrestling"
    ? WRESTLING_AWARDS_SUGGESTIONS
    : VOLLEYBALL_AWARDS_SUGGESTIONS;
}

export function formatHeight(inches?: number): string {
  if (!inches || inches <= 0) return "";
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}"`;
}

export function parseHeight(str: string): number | undefined {
  const m = str.match(/^(\d+)['’]\s*(\d+)?/);
  if (m) {
    const ft = parseInt(m[1], 10);
    const inch = m[2] ? parseInt(m[2], 10) : 0;
    return ft * 12 + inch;
  }
  const n = parseInt(str, 10);
  return isNaN(n) ? undefined : n;
}

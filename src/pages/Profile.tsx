import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import {
  VOLLEYBALL_POSITION_LABELS,
  VOLLEYBALL_POSITION_ORDER,
  WRESTLING_STYLE_LABELS,
  WRESTLING_WEIGHT_CLASSES_BOYS,
  WRESTLING_WEIGHT_CLASSES_GIRLS,
  awardsForSport,
  formatHeight,
  parseHeight,
  tournamentsForSport,
} from "../lib/profileOptions";
import type {
  AwardEntry,
  Gender,
  GoalsBlock,
  Hand,
  TournamentEntry,
  VolleyballPosition,
  VolleyballStats,
  WrestlingStats,
  WrestlingStyle,
} from "../types";
import {
  ArrowLeft,
  User,
  Dumbbell,
  BarChart3,
  Trophy,
  Medal,
  Target,
  Pencil,
  Plus,
  X,
  Check,
} from "lucide-react";

type Section =
  | null
  | "about"
  | "sport"
  | "stats"
  | "tournaments"
  | "awards"
  | "goals";

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ProfilePage() {
  const { state } = useStore();
  const [editing, setEditing] = useState<Section>(null);

  if (!state.profile) return null;
  const p = state.profile;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="page-title">Athlete Profile</h1>
        <p className="page-subtitle">
          Tell your story. Fill in as much or as little as you want.
        </p>
      </header>

      {/* Identity card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-5 shadow-elevated">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-extrabold">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight">
              {p.name} {p.lastName ?? ""}
            </div>
            <div className="text-sm text-white/80 mt-0.5 capitalize">
              {p.sport} · Grade {p.grade} · Age {p.age}
            </div>
            {p.teamName && (
              <div className="text-xs text-white/70 mt-0.5">
                {p.teamName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section cards */}
      <SectionRow
        icon={<User size={18} />}
        label="About Me"
        summary={aboutSummary(p)}
        onEdit={() => setEditing("about")}
      />

      <SectionRow
        icon={<Dumbbell size={18} />}
        label={
          p.sport === "wrestling" ? "Wrestling Details" : "Volleyball Details"
        }
        summary={sportSummary(p)}
        onEdit={() => setEditing("sport")}
      />

      <SectionRow
        icon={<BarChart3 size={18} />}
        label="Season Stats"
        summary={statsSummary(p)}
        onEdit={() => setEditing("stats")}
      />

      <SectionRow
        icon={<Trophy size={18} />}
        label="Tournaments"
        summary={
          p.tournaments?.length
            ? `${p.tournaments.length} logged`
            : "None yet — log your tournament results"
        }
        onEdit={() => setEditing("tournaments")}
      />

      <SectionRow
        icon={<Medal size={18} />}
        label="Awards & Accolades"
        summary={
          p.awards?.length
            ? `${p.awards.length} earned`
            : "None yet — celebrate your wins"
        }
        onEdit={() => setEditing("awards")}
      />

      <SectionRow
        icon={<Target size={18} />}
        label="Goals"
        summary={
          p.goals
            ? "Set and working toward greatness"
            : "Set goals for this season"
        }
        onEdit={() => setEditing("goals")}
      />

      {/* Modals */}
      {editing === "about" && <AboutModal onClose={() => setEditing(null)} />}
      {editing === "sport" && <SportModal onClose={() => setEditing(null)} />}
      {editing === "stats" && <StatsModal onClose={() => setEditing(null)} />}
      {editing === "tournaments" && (
        <TournamentsModal onClose={() => setEditing(null)} />
      )}
      {editing === "awards" && <AwardsModal onClose={() => setEditing(null)} />}
      {editing === "goals" && <GoalsModal onClose={() => setEditing(null)} />}

      <div className="h-2" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Summaries
// -----------------------------------------------------------------------------
function aboutSummary(p: ReturnType<typeof useStoreProfile>): string {
  const parts: string[] = [];
  if (p.heightInches) parts.push(formatHeight(p.heightInches));
  if (p.weightLbs) parts.push(`${p.weightLbs} lbs`);
  if (p.hometown) parts.push(p.hometown);
  return parts.length ? parts.join(" · ") : "Add your height, weight, hometown";
}

function sportSummary(p: ReturnType<typeof useStoreProfile>): string {
  if (p.sport === "wrestling") {
    const bits: string[] = [];
    if (p.weightClass) bits.push(`${p.weightClass} lbs`);
    if (p.wrestlingStyles?.length)
      bits.push(
        p.wrestlingStyles.map((s) => WRESTLING_STYLE_LABELS[s]).join(", ")
      );
    if (p.yearsPlaying != null) bits.push(`${p.yearsPlaying} yr`);
    return bits.length ? bits.join(" · ") : "Add weight class, styles, years";
  }
  const bits: string[] = [];
  if (p.primaryPosition)
    bits.push(VOLLEYBALL_POSITION_LABELS[p.primaryPosition]);
  if (p.jerseyNumber) bits.push(`#${p.jerseyNumber}`);
  if (p.verticalJumpInches) bits.push(`${p.verticalJumpInches}" vert`);
  return bits.length ? bits.join(" · ") : "Add position, jersey, vertical";
}

function statsSummary(p: ReturnType<typeof useStoreProfile>): string {
  if (p.sport === "wrestling" && p.wrestlingStats) {
    const s = p.wrestlingStats;
    if (s.wins != null || s.losses != null) {
      return `${s.season ?? "This season"}: ${s.wins ?? 0}-${s.losses ?? 0}${
        s.pins ? ` · ${s.pins} pins` : ""
      }`;
    }
  }
  if (p.sport === "volleyball" && p.volleyballStats) {
    const s = p.volleyballStats;
    const bits: string[] = [];
    if (s.kills) bits.push(`${s.kills} kills`);
    if (s.digs) bits.push(`${s.digs} digs`);
    if (s.assists) bits.push(`${s.assists} assists`);
    if (bits.length) return `${s.season ?? "This season"}: ${bits.join(" · ")}`;
  }
  return "Track your stats this season";
}

// Tiny helper so TypeScript knows the right Profile shape
function useStoreProfile() {
  const { state } = useStore();
  return state.profile!;
}

// -----------------------------------------------------------------------------
// Section row
// -----------------------------------------------------------------------------
function SectionRow({
  icon,
  label,
  summary,
  onEdit,
}: {
  icon: React.ReactNode;
  label: string;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className="card w-full flex items-center gap-3 text-left hover:shadow-card-hover hover:border-slate-200 transition"
    >
      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5 truncate">{summary}</div>
      </div>
      <Pencil size={14} className="text-slate-300" />
    </button>
  );
}

// -----------------------------------------------------------------------------
// Modal shell
// -----------------------------------------------------------------------------
function Modal({
  title,
  onClose,
  onSave,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-elevated p-5 animate-slide-up">
        <div className="flex items-center justify-between sticky top-0 bg-white pb-3 -mx-5 px-5 border-b border-slate-100 z-10">
          <h2 className="font-extrabold text-lg text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {onSave && (
          <div className="mt-6 flex gap-2">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={() => {
                onSave();
                onClose();
              }}
              className="btn-primary flex-1"
            >
              <Check size={16} className="inline mr-1" /> Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 outline-none transition";

// -----------------------------------------------------------------------------
// About modal
// -----------------------------------------------------------------------------
function AboutModal({ onClose }: { onClose: () => void }) {
  const { state, updateProfile } = useStore();
  const p = state.profile!;
  const [lastName, setLastName] = useState(p.lastName ?? "");
  const [gender, setGender] = useState<Gender | "">(p.gender ?? "");
  const [heightStr, setHeightStr] = useState(
    p.heightInches ? formatHeight(p.heightInches) : ""
  );
  const [weight, setWeight] = useState(
    p.weightLbs ? String(p.weightLbs) : ""
  );
  const [yearsPlaying, setYearsPlaying] = useState(
    p.yearsPlaying != null ? String(p.yearsPlaying) : ""
  );
  const [teamName, setTeamName] = useState(p.teamName ?? "");
  const [coachName, setCoachName] = useState(p.coachName ?? "");
  const [jerseyNumber, setJerseyNumber] = useState(p.jerseyNumber ?? "");
  const [hometown, setHometown] = useState(p.hometown ?? "");

  return (
    <Modal
      title="About Me"
      onClose={onClose}
      onSave={() =>
        updateProfile({
          lastName: lastName.trim() || undefined,
          gender: (gender || undefined) as Gender | undefined,
          heightInches: parseHeight(heightStr),
          weightLbs: weight ? parseInt(weight, 10) : undefined,
          yearsPlaying:
            yearsPlaying !== "" ? parseInt(yearsPlaying, 10) : undefined,
          teamName: teamName.trim() || undefined,
          coachName: coachName.trim() || undefined,
          jerseyNumber: jerseyNumber.trim() || undefined,
          hometown: hometown.trim() || undefined,
        })
      }
    >
      <div className="space-y-4">
        <Field label="Last Name">
          <input
            className={inputCls}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="Gender">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "male", l: "Male" },
              { v: "female", l: "Female" },
              { v: "other", l: "Other" },
              { v: "prefer-not-to-say", l: "Prefer not to say" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setGender(o.v as Gender)}
                className={`py-2 px-3 rounded-xl border-2 text-sm font-semibold transition ${
                  gender === o.v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Height">
            <input
              className={inputCls}
              value={heightStr}
              onChange={(e) => setHeightStr(e.target.value)}
              placeholder={"e.g. 5'9\""}
            />
          </Field>
          <Field label="Weight (lbs)">
            <input
              type="number"
              className={inputCls}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 145"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Years Playing">
            <input
              type="number"
              className={inputCls}
              value={yearsPlaying}
              onChange={(e) => setYearsPlaying(e.target.value)}
              placeholder="e.g. 3"
            />
          </Field>
          <Field label="Jersey #">
            <input
              className={inputCls}
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="e.g. 7"
            />
          </Field>
        </div>

        <Field label="Team / Club">
          <input
            className={inputCls}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Eagles Wrestling Club"
          />
        </Field>

        <Field label="Coach">
          <input
            className={inputCls}
            value={coachName}
            onChange={(e) => setCoachName(e.target.value)}
            placeholder="e.g. Coach Rodriguez"
          />
        </Field>

        <Field label="Hometown">
          <input
            className={inputCls}
            value={hometown}
            onChange={(e) => setHometown(e.target.value)}
            placeholder="e.g. Iowa City, IA"
          />
        </Field>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Sport-specific modal
// -----------------------------------------------------------------------------
function SportModal({ onClose }: { onClose: () => void }) {
  const { state, updateProfile } = useStore();
  const p = state.profile!;

  // Wrestling state
  const [weightClass, setWeightClass] = useState<number | undefined>(
    p.weightClass
  );
  const [genderForWeights] = useState<"boys" | "girls">(
    p.gender === "female" ? "girls" : "boys"
  );
  const [styles, setStyles] = useState<WrestlingStyle[]>(
    p.wrestlingStyles ?? []
  );

  // Volleyball state
  const [primary, setPrimary] = useState<VolleyballPosition | undefined>(
    p.primaryPosition
  );
  const [secondary, setSecondary] = useState<VolleyballPosition | undefined>(
    p.secondaryPosition
  );
  const [hand, setHand] = useState<Hand | undefined>(p.dominantHand);
  const [vert, setVert] = useState(
    p.verticalJumpInches ? String(p.verticalJumpInches) : ""
  );
  const [approach, setApproach] = useState(
    p.approachJumpInches ? String(p.approachJumpInches) : ""
  );

  function toggleStyle(s: WrestlingStyle) {
    setStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const weights =
    genderForWeights === "girls"
      ? WRESTLING_WEIGHT_CLASSES_GIRLS
      : WRESTLING_WEIGHT_CLASSES_BOYS;

  return (
    <Modal
      title={p.sport === "wrestling" ? "Wrestling Details" : "Volleyball Details"}
      onClose={onClose}
      onSave={() => {
        if (p.sport === "wrestling") {
          updateProfile({
            weightClass,
            wrestlingStyles: styles.length > 0 ? styles : undefined,
          });
        } else {
          updateProfile({
            primaryPosition: primary,
            secondaryPosition: secondary,
            dominantHand: hand,
            verticalJumpInches: vert ? parseInt(vert, 10) : undefined,
            approachJumpInches: approach ? parseInt(approach, 10) : undefined,
          });
        }
      }}
    >
      {p.sport === "wrestling" ? (
        <div className="space-y-4">
          <Field label="Weight Class (lbs)">
            <div className="flex flex-wrap gap-1.5">
              {weights.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() =>
                    setWeightClass(weightClass === w ? undefined : w)
                  }
                  className={`px-2.5 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                    weightClass === w
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Styles You Wrestle">
            <div className="grid grid-cols-3 gap-2">
              {(
                Object.entries(WRESTLING_STYLE_LABELS) as [
                  WrestlingStyle,
                  string
                ][]
              ).map(([key, label]) => {
                const selected = styles.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleStyle(key)}
                    className={`py-2 rounded-xl border-2 text-xs font-semibold transition ${
                      selected
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Primary Position">
            <div className="grid grid-cols-2 gap-2">
              {VOLLEYBALL_POSITION_ORDER.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() =>
                    setPrimary(primary === pos ? undefined : pos)
                  }
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition ${
                    primary === pos
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {VOLLEYBALL_POSITION_LABELS[pos]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Secondary Position (optional)">
            <select
              className={inputCls}
              value={secondary ?? ""}
              onChange={(e) =>
                setSecondary(
                  e.target.value
                    ? (e.target.value as VolleyballPosition)
                    : undefined
                )
              }
            >
              <option value="">None</option>
              {VOLLEYBALL_POSITION_ORDER.map((pos) => (
                <option key={pos} value={pos}>
                  {VOLLEYBALL_POSITION_LABELS[pos]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dominant Hand">
            <div className="grid grid-cols-3 gap-2">
              {(["right", "left", "ambidextrous"] as Hand[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHand(hand === h ? undefined : h)}
                  className={`py-2 rounded-xl border-2 text-xs font-semibold capitalize transition ${
                    hand === h
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vertical Jump (in)">
              <input
                type="number"
                className={inputCls}
                value={vert}
                onChange={(e) => setVert(e.target.value)}
                placeholder="e.g. 24"
              />
            </Field>
            <Field label="Approach Jump (in)">
              <input
                type="number"
                className={inputCls}
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                placeholder="e.g. 28"
              />
            </Field>
          </div>
        </div>
      )}
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Stats modal
// -----------------------------------------------------------------------------
function StatsModal({ onClose }: { onClose: () => void }) {
  const { state, updateProfile } = useStore();
  const p = state.profile!;

  const defaultSeason = `${new Date().getFullYear()}-${String(
    (new Date().getFullYear() + 1) % 100
  ).padStart(2, "0")}`;

  if (p.sport === "wrestling") {
    const existing: WrestlingStats = p.wrestlingStats ?? {};
    return (
      <WrestlingStatsForm
        initial={{ season: defaultSeason, ...existing }}
        onClose={onClose}
        onSave={(v) => updateProfile({ wrestlingStats: v })}
      />
    );
  }
  const existing: VolleyballStats = p.volleyballStats ?? {};
  return (
    <VolleyballStatsForm
      initial={{ season: defaultSeason, ...existing }}
      onClose={onClose}
      onSave={(v) => updateProfile({ volleyballStats: v })}
    />
  );
}

function WrestlingStatsForm({
  initial,
  onClose,
  onSave,
}: {
  initial: WrestlingStats;
  onClose: () => void;
  onSave: (v: WrestlingStats) => void;
}) {
  const [season, setSeason] = useState(initial.season ?? "");
  const [wins, setWins] = useState(initial.wins?.toString() ?? "");
  const [losses, setLosses] = useState(initial.losses?.toString() ?? "");
  const [pins, setPins] = useState(initial.pins?.toString() ?? "");
  const [tech, setTech] = useState(initial.techFalls?.toString() ?? "");
  const [major, setMajor] = useState(
    initial.majorDecisions?.toString() ?? ""
  );

  function parseN(s: string): number | undefined {
    return s ? parseInt(s, 10) : undefined;
  }

  return (
    <Modal
      title="Season Stats"
      onClose={onClose}
      onSave={() =>
        onSave({
          season: season.trim() || undefined,
          wins: parseN(wins),
          losses: parseN(losses),
          pins: parseN(pins),
          techFalls: parseN(tech),
          majorDecisions: parseN(major),
        })
      }
    >
      <div className="space-y-4">
        <Field label="Season">
          <input
            className={inputCls}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="e.g. 2024-25"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Wins">
            <input
              type="number"
              className={inputCls}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
            />
          </Field>
          <Field label="Losses">
            <input
              type="number"
              className={inputCls}
              value={losses}
              onChange={(e) => setLosses(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Pins">
            <input
              type="number"
              className={inputCls}
              value={pins}
              onChange={(e) => setPins(e.target.value)}
            />
          </Field>
          <Field label="Tech Falls">
            <input
              type="number"
              className={inputCls}
              value={tech}
              onChange={(e) => setTech(e.target.value)}
            />
          </Field>
          <Field label="Major Dec.">
            <input
              type="number"
              className={inputCls}
              value={major}
              onChange={(e) => setMajor(e.target.value)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function VolleyballStatsForm({
  initial,
  onClose,
  onSave,
}: {
  initial: VolleyballStats;
  onClose: () => void;
  onSave: (v: VolleyballStats) => void;
}) {
  const [season, setSeason] = useState(initial.season ?? "");
  const [matches, setMatches] = useState(
    initial.matchesPlayed?.toString() ?? ""
  );
  const [kills, setKills] = useState(initial.kills?.toString() ?? "");
  const [digs, setDigs] = useState(initial.digs?.toString() ?? "");
  const [assists, setAssists] = useState(initial.assists?.toString() ?? "");
  const [blocks, setBlocks] = useState(initial.blocks?.toString() ?? "");
  const [aces, setAces] = useState(initial.aces?.toString() ?? "");
  const [hitPct, setHitPct] = useState(
    initial.hittingPct?.toString() ?? ""
  );

  function parseN(s: string): number | undefined {
    return s ? parseInt(s, 10) : undefined;
  }

  return (
    <Modal
      title="Season Stats"
      onClose={onClose}
      onSave={() =>
        onSave({
          season: season.trim() || undefined,
          matchesPlayed: parseN(matches),
          kills: parseN(kills),
          digs: parseN(digs),
          assists: parseN(assists),
          blocks: parseN(blocks),
          aces: parseN(aces),
          hittingPct: hitPct ? parseFloat(hitPct) : undefined,
        })
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Season">
            <input
              className={inputCls}
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="2024-25"
            />
          </Field>
          <Field label="Matches">
            <input
              type="number"
              className={inputCls}
              value={matches}
              onChange={(e) => setMatches(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Kills">
            <input
              type="number"
              className={inputCls}
              value={kills}
              onChange={(e) => setKills(e.target.value)}
            />
          </Field>
          <Field label="Digs">
            <input
              type="number"
              className={inputCls}
              value={digs}
              onChange={(e) => setDigs(e.target.value)}
            />
          </Field>
          <Field label="Assists">
            <input
              type="number"
              className={inputCls}
              value={assists}
              onChange={(e) => setAssists(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Blocks">
            <input
              type="number"
              className={inputCls}
              value={blocks}
              onChange={(e) => setBlocks(e.target.value)}
            />
          </Field>
          <Field label="Aces">
            <input
              type="number"
              className={inputCls}
              value={aces}
              onChange={(e) => setAces(e.target.value)}
            />
          </Field>
          <Field label="Hit %">
            <input
              type="number"
              step="0.001"
              className={inputCls}
              value={hitPct}
              onChange={(e) => setHitPct(e.target.value)}
              placeholder="0.312"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Tournaments modal
// -----------------------------------------------------------------------------
function TournamentsModal({ onClose }: { onClose: () => void }) {
  const { state, updateProfile } = useStore();
  const p = state.profile!;
  const [list, setList] = useState<TournamentEntry[]>(p.tournaments ?? []);
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [result, setResult] = useState("");

  const suggestions = tournamentsForSport(p.sport);

  function add() {
    if (!name.trim()) return;
    setList((prev) => [
      ...prev,
      {
        id: genId(),
        name: name.trim(),
        year: parseInt(year, 10) || new Date().getFullYear(),
        result: result.trim() || "Competed",
      },
    ]);
    setName("");
    setResult("");
  }

  function remove(id: string) {
    setList((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <Modal
      title="Tournaments"
      onClose={onClose}
      onSave={() => updateProfile({ tournaments: list })}
    >
      {list.length > 0 && (
        <div className="space-y-2 mb-4">
          {list.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-xl border border-slate-200 p-3"
            >
              <Trophy size={16} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 truncate">
                  {t.name}
                </div>
                <div className="text-xs text-slate-500">
                  {t.year} · {t.result}
                </div>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-slate-50 p-3 space-y-3">
        <Field label="Tournament Name">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. State Tournament"
            list="tournament-suggestions"
          />
          <datalist id="tournament-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <input
              type="number"
              className={inputCls}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </Field>
          <Field label="Result">
            <input
              className={inputCls}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="1st / Qualified / Top 8"
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!name.trim()}
          className="btn-primary w-full !py-2.5 disabled:opacity-40"
        >
          <Plus size={16} className="inline mr-1" /> Add Tournament
        </button>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Awards modal
// -----------------------------------------------------------------------------
function AwardsModal({ onClose }: { onClose: () => void }) {
  const { state, updateProfile } = useStore();
  const p = state.profile!;
  const [list, setList] = useState<AwardEntry[]>(p.awards ?? []);
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [note, setNote] = useState("");

  const suggestions = awardsForSport(p.sport);

  function add() {
    if (!name.trim()) return;
    setList((prev) => [
      ...prev,
      {
        id: genId(),
        name: name.trim(),
        year: parseInt(year, 10) || new Date().getFullYear(),
        note: note.trim() || undefined,
      },
    ]);
    setName("");
    setNote("");
  }

  function remove(id: string) {
    setList((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <Modal
      title="Awards & Accolades"
      onClose={onClose}
      onSave={() => updateProfile({ awards: list })}
    >
      {list.length > 0 && (
        <div className="space-y-2 mb-4">
          {list.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-xl border border-slate-200 p-3"
            >
              <Medal size={16} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 truncate">
                  {a.name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {a.year}
                  {a.note ? ` · ${a.note}` : ""}
                </div>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-slate-50 p-3 space-y-3">
        <Field label="Award / Accolade">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. All-Conference"
            list="award-suggestions"
          />
          <datalist id="award-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <input
              type="number"
              className={inputCls}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </Field>
          <Field label="Note (optional)">
            <input
              className={inputCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. 132 lbs"
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!name.trim()}
          className="btn-primary w-full !py-2.5 disabled:opacity-40"
        >
          <Plus size={16} className="inline mr-1" /> Add Award
        </button>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Goals modal
// -----------------------------------------------------------------------------
function GoalsModal({ onClose }: { onClose: () => void }) {
  const { state, updateProfile } = useStore();
  const p = state.profile!;
  const g: GoalsBlock = p.goals ?? {};

  // Gracefully migrate legacy fields on first open so the athlete doesn't
  // lose what they've already written.
  const [processWeek, setProcessWeek] = useState(
    g.processWeek ?? g.shortTerm ?? ""
  );
  const [processSeason, setProcessSeason] = useState(g.processSeason ?? "");
  const [outcomeSeason, setOutcomeSeason] = useState(
    g.outcomeSeason ?? g.season ?? ""
  );
  const [outcomeCareer, setOutcomeCareer] = useState(
    g.outcomeCareer ?? g.career ?? ""
  );
  const [strengths, setStrengths] = useState(g.strengths ?? "");
  const [workingOn, setWorkingOn] = useState(g.workingOn ?? "");

  const textareaCls = inputCls + " min-h-[72px] resize-none";

  return (
    <Modal
      title="Goals & Self-Reflection"
      onClose={onClose}
      onSave={() =>
        updateProfile({
          goals: {
            processWeek: processWeek.trim() || undefined,
            processSeason: processSeason.trim() || undefined,
            outcomeSeason: outcomeSeason.trim() || undefined,
            outcomeCareer: outcomeCareer.trim() || undefined,
            strengths: strengths.trim() || undefined,
            workingOn: workingOn.trim() || undefined,
            // Clear legacy fields — their content has been migrated above
            shortTerm: undefined,
            season: undefined,
            career: undefined,
          },
        })
      }
    >
      <div className="space-y-5">
        {/* Process goals */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4 space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] font-bold text-emerald-700">
              Process Goals
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              What you&apos;ll <strong>do</strong>. You control these every day.
            </p>
          </div>
          <Field label="This week">
            <textarea
              className={textareaCls}
              value={processWeek}
              onChange={(e) => setProcessWeek(e.target.value)}
              placeholder="Drill my single leg 100 times. Sleep 8+ hours every night."
            />
          </Field>
          <Field label="This season">
            <textarea
              className={textareaCls}
              value={processSeason}
              onChange={(e) => setProcessSeason(e.target.value)}
              placeholder="Show up 15 min early. No half reps. Watch film every Sunday."
            />
          </Field>
        </div>

        {/* Outcome goals */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-4 space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] font-bold text-amber-700">
              Outcome Goals
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              What you want to <strong>achieve</strong>. Results follow process.
            </p>
          </div>
          <Field label="This season">
            <textarea
              className={textareaCls}
              value={outcomeSeason}
              onChange={(e) => setOutcomeSeason(e.target.value)}
              placeholder="Qualify for state, 25+ wins"
            />
          </Field>
          <Field label="Career">
            <textarea
              className={textareaCls}
              value={outcomeCareer}
              onChange={(e) => setOutcomeCareer(e.target.value)}
              placeholder="Earn a college scholarship, compete at nationals"
            />
          </Field>
        </div>

        {/* Self-reflection */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-500">
            Self-Reflection
          </div>
          <Field label="My Strengths">
            <textarea
              className={textareaCls}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Explosive first shot, strong top position"
            />
          </Field>
          <Field label="What I'm Working On">
            <textarea
              className={textareaCls}
              value={workingOn}
              onChange={(e) => setWorkingOn(e.target.value)}
              placeholder="Scrambling, finishing on the edge, conditioning"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

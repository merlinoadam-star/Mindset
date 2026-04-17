import { useEffect, useState } from "react";
import { Target, Save, Check, Sparkles, RefreshCw, BookOpen, X } from "lucide-react";
import { useAuth } from "../lib/authContext";
import {
  fetchWeeklyFocus,
  mondayOf,
  setWeeklyFocus,
  type WeeklyFocusRow,
} from "../lib/weeklyFocusSync";
import { fetchFocusSuggestions } from "../lib/aiCoach";
import {
  SKILL_CATALOG,
  CATEGORY_LABELS,
  type SkillCategory,
  type SkillChallenge,
} from "../lib/skillCatalog";

/**
 * Coach / parent-side editor. Shows up on AthleteView for a connected
 * athlete; lets the author set (or replace) this week's focus.
 *
 * Two ways to set focus:
 *   1. Pick from the skill catalog — renders rich card on athlete side
 *   2. Write free-text — same behavior as before
 */
export default function CoachWeeklyFocusCard({
  athleteId,
}: {
  athleteId: string;
}) {
  const { account } = useAuth();
  const [existing, setExisting] = useState<WeeklyFocusRow | null>(null);
  const [text, setText] = useState("");
  const [skillId, setSkillId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  const isAuthor =
    account && (account.role === "coach" || account.role === "parent");

  const load = async () => {
    const r = await fetchWeeklyFocus(athleteId);
    setExisting(r);
    if (r) {
      setText(r.text);
      setSkillId(r.skill_id);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  if (!isAuthor || !account) return null;

  const dirty =
    text.trim() !== (existing?.text ?? "").trim() ||
    skillId !== (existing?.skill_id ?? null);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setErr("Focus can't be empty.");
      return;
    }
    setSaving(true);
    setErr(null);
    const { error } = await setWeeklyFocus({
      athleteId,
      authorId: account.id,
      authorRole: account.role,
      text: trimmed,
      skillId,
    });
    setSaving(false);
    if (error) {
      setErr(error);
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
    load();
  };

  const getSuggestions = async (refresh = false) => {
    setSuggesting(true);
    setSuggestErr(null);
    const { suggestions: out, error } = await fetchFocusSuggestions({
      athleteId,
      refresh,
    });
    setSuggesting(false);
    if (error) {
      setSuggestErr(error);
      return;
    }
    setSuggestions(out ?? []);
  };

  const pickSkill = (skill: SkillChallenge) => {
    setSkillId(skill.id);
    // Pre-fill text with the skill's blurb — coach can edit
    setText(skill.blurb);
    setShowCatalog(false);
  };

  const clearSkill = () => {
    setSkillId(null);
  };

  const selectedSkill =
    skillId !== null ? SKILL_CATALOG.find((s) => s.id === skillId) : null;

  return (
    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
          <Target size={16} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
            Weekly Focus
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Week of {formatWeek(mondayOf())}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCatalog(!showCatalog)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg bg-white border border-amber-200"
        >
          <BookOpen size={11} /> {showCatalog ? "Close" : "Pick a skill"}
        </button>
      </div>

      {showCatalog && (
        <SkillCatalogPicker onPick={pickSkill} selectedId={skillId} />
      )}

      {/* Selected skill chip */}
      {selectedSkill && !showCatalog && (
        <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2 mb-2">
          <div className="text-xl">{selectedSkill.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {selectedSkill.title}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {CATEGORY_LABELS[selectedSkill.category]}
            </div>
          </div>
          <button
            type="button"
            onClick={clearSkill}
            className="text-slate-400 hover:text-slate-700 p-1"
            aria-label="Remove skill"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          selectedSkill
            ? "Tweak the message the athlete sees…"
            : "What should they focus on this week?"
        }
        rows={2}
        maxLength={240}
        className="w-full text-sm bg-white border border-amber-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {/* AI-suggested focus options */}
      <div className="mt-2">
        {suggestions.length === 0 ? (
          <button
            type="button"
            onClick={() => getSuggestions(false)}
            disabled={suggesting}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 hover:text-purple-900 disabled:opacity-50"
          >
            <Sparkles size={11} />
            {suggesting ? "Thinking…" : "Suggest ideas from their data"}
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-purple-700">
                <Sparkles size={10} /> AI ideas
              </span>
              <button
                type="button"
                onClick={() => getSuggestions(true)}
                disabled={suggesting}
                className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold inline-flex items-center gap-1"
              >
                <RefreshCw size={9} /> New ideas
              </button>
            </div>
            <div className="space-y-1">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setText(s);
                    setSkillId(null);
                  }}
                  className="w-full text-left text-[12px] leading-snug px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-slate-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {suggestErr && (
          <div className="text-[11px] text-red-600 font-medium mt-1">
            {suggestErr}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-[11px] text-slate-500">
          {text.length}/240
          {existing && !dirty && (
            <span className="ml-2 text-slate-400">· Saved</span>
          )}
        </div>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={handleSave}
          className="btn-primary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saved ? (
            <>
              <Check size={14} /> Sent!
            </>
          ) : (
            <>
              <Save size={14} /> {existing ? "Update" : "Send"}
            </>
          )}
        </button>
      </div>
      {err && (
        <div className="text-xs text-red-600 mt-2 font-medium">{err}</div>
      )}
    </div>
  );
}

function SkillCatalogPicker({
  onPick,
  selectedId,
}: {
  onPick: (s: SkillChallenge) => void;
  selectedId: string | null;
}) {
  const [filter, setFilter] = useState<SkillCategory | "all">("all");

  const filtered = SKILL_CATALOG.filter(
    (s) => filter === "all" || s.category === filter
  );

  const categories: Array<SkillCategory | "all"> = [
    "all",
    "mental",
    "physical",
    "recovery",
    "mindset",
  ];

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-2 mb-2 max-h-80 overflow-y-auto">
      <div className="flex gap-1 mb-2 sticky top-0 bg-white pb-1 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
              filter === c
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {c === "all" ? "All" : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s)}
            className={`w-full text-left flex items-start gap-2 p-2 rounded-lg border transition ${
              selectedId === s.id
                ? "bg-amber-50 border-amber-400"
                : "border-slate-100 hover:bg-slate-50"
            }`}
          >
            <div className="text-xl flex-shrink-0 leading-none mt-0.5">
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {s.title}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {CATEGORY_LABELS[s.category]}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                {s.blurb}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatWeek(monday: string): string {
  try {
    const d = new Date(monday + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return monday;
  }
}

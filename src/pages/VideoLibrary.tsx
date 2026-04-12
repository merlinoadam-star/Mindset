import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import { loadVideoBlob, formatBytes, formatDuration } from "../lib/videoStorage";
import {
  VIDEO_TAG_EMOJIS,
  VIDEO_TAG_LABELS,
  type VideoAudience,
  type VideoEntry,
  type VideoTag,
} from "../types";
import {
  ArrowLeft,
  Video as VideoIcon,
  Upload,
  Play,
  Trash2,
  Check,
  X,
  Eye,
  ChevronRight,
  Sparkles,
  Pencil,
} from "lucide-react";

const TAG_ORDER: VideoTag[] = [
  "technique",
  "drill",
  "match",
  "form-check",
  "highlight",
  "other",
];

export default function VideoLibraryPage() {
  const { state } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<VideoTag | "all">("all");

  if (!state.profile) return null;

  const filtered = useMemo(() => {
    const list =
      filterTag === "all"
        ? state.videos
        : state.videos.filter((v) => v.tag === filterTag);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.videos, filterTag]);

  const totalSize = state.videos.reduce((a, v) => a + v.sizeBytes, 0);

  if (openVideoId) {
    const video = state.videos.find((v) => v.id === openVideoId);
    if (video) {
      return (
        <VideoDetail video={video} onBack={() => setOpenVideoId(null)} />
      );
    }
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center">
                <VideoIcon size={18} />
              </div>
              <h1 className="page-title">Video Library</h1>
            </div>
            <p className="page-subtitle">
              {state.videos.length} video
              {state.videos.length === 1 ? "" : "s"} ·{" "}
              {formatBytes(totalSize)}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1"
          >
            <Upload size={16} /> Add
          </button>
        </div>
      </header>

      {/* Phase 2 preview notice */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100 p-3 flex items-start gap-2">
        <Sparkles size={14} className="text-brand-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold">Coming soon:</span> share videos with
          your coach or parent for feedback. For now, mark videos for review
          and add notes to yourself.
        </div>
      </div>

      {/* Filter */}
      {state.videos.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <FilterChip
            label="All"
            active={filterTag === "all"}
            onClick={() => setFilterTag("all")}
          />
          {TAG_ORDER.map((t) => {
            const count = state.videos.filter((v) => v.tag === t).length;
            if (count === 0) return null;
            return (
              <FilterChip
                key={t}
                label={`${VIDEO_TAG_EMOJIS[t]} ${VIDEO_TAG_LABELS[t]} ${count}`}
                active={filterTag === t}
                onClick={() => setFilterTag(t)}
              />
            );
          })}
        </div>
      )}

      {showAdd && <AddVideoForm onClose={() => setShowAdd(false)} />}

      {state.videos.length === 0 && !showAdd ? (
        <div className="card text-center py-10">
          <VideoIcon size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold mt-3 text-slate-900">No videos yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            Record or upload a clip of a technique, drill, or match. Review
            it yourself, or flag it for coach review later.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary mt-5"
          >
            <Upload size={16} className="inline mr-1" /> Add First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onClick={() => setOpenVideoId(v.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Filter chip
// -----------------------------------------------------------------------------
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
        active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-slate-700 border-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Video card
// -----------------------------------------------------------------------------
function VideoCard({
  video,
  onClick,
}: {
  video: VideoEntry;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left group rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition"
    >
      <div className="aspect-video bg-slate-900 relative overflow-hidden">
        {video.thumbnailDataUrl ? (
          <img
            src={video.thumbnailDataUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <VideoIcon size={32} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          <Play size={10} fill="white" />
          {formatDuration(video.durationSec) || "Play"}
        </div>
        <div className="absolute top-1 right-1 text-xl drop-shadow">
          {VIDEO_TAG_EMOJIS[video.tag]}
        </div>
        {video.markedForReview && !video.reviewedAt && (
          <div className="absolute top-1 left-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Review
          </div>
        )}
        {video.reviewedAt && (
          <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
            <Check size={8} strokeWidth={3} /> Done
          </div>
        )}
      </div>
      <div className="p-2.5">
        <div className="font-bold text-sm text-slate-900 truncate">
          {video.title}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
          <span>{VIDEO_TAG_LABELS[video.tag]}</span>
          <span>·</span>
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Add video form
// -----------------------------------------------------------------------------
function AddVideoForm({ onClose }: { onClose: () => void }) {
  const { addVideo } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<VideoTag>("technique");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<VideoAudience>("self");
  const [markedForReview, setMarkedForReview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // Prefill title from filename if empty
    if (!title) {
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      setTitle(base.slice(0, 60));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setSaving(true);
    try {
      const { awardedXp, newlyUnlocked } = await addVideo(file, {
        title: title.trim(),
        description: description.trim() || undefined,
        tag,
        audience,
        markedForReview: markedForReview || undefined,
      });
      showReward(awardedXp, newlyUnlocked);
      onClose();
    } catch (err) {
      console.error(err);
      alert(
        "Couldn't save this video. It might be too large for this device's storage."
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 animate-pop-in">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-slate-900">Add Video</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </div>

      {/* File input / preview */}
      {!file ? (
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="video/*"
            capture="environment"
            className="sr-only"
            onChange={handleFile}
          />
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-brand-400 hover:bg-brand-50/40 transition">
            <Upload className="mx-auto text-slate-400" size={28} />
            <div className="text-sm font-bold text-slate-700 mt-2">
              Record or choose a video
            </div>
            <div className="text-xs text-slate-500 mt-1">
              On your phone, this opens the camera.
            </div>
          </div>
        </label>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-black aspect-video">
          {previewUrl && (
            <video
              src={previewUrl}
              controls
              playsInline
              className="w-full h-full"
            />
          )}
        </div>
      )}

      {file && (
        <>
          <Label>Title</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Single leg finish — need work on hip pressure"
            className={inputCls}
            required
          />

          <div>
            <Label>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_ORDER.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-bold border-2 transition flex items-center gap-1 ${
                    tag === t
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  <span>{VIDEO_TAG_EMOJIS[t]}</span>
                  <span>{VIDEO_TAG_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Who is this for?</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { v: "self", l: "Just me" },
                  { v: "coach", l: "For coach" },
                  { v: "parent", l: "For parent" },
                ] as { v: VideoAudience; l: string }[]
              ).map((a) => (
                <button
                  key={a.v}
                  type="button"
                  onClick={() => setAudience(a.v)}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition ${
                    audience === a.v
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {a.l}
                </button>
              ))}
            </div>
            {(audience === "coach" || audience === "parent") && (
              <p className="text-[11px] text-slate-500 mt-1">
                Sharing is coming in Phase 2 — for now this is saved locally.
              </p>
            )}
          </div>

          <div>
            <Label>Description (optional)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's this video showing? What do you want feedback on?"
              className={inputCls + " resize-none"}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={markedForReview}
              onChange={(e) => setMarkedForReview(e.target.checked)}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-slate-700 font-medium">
              Mark for review
            </span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Video +10 XP"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

// -----------------------------------------------------------------------------
// Video detail
// -----------------------------------------------------------------------------
function VideoDetail({
  video,
  onBack,
}: {
  video: VideoEntry;
  onBack: () => void;
}) {
  const { updateVideo, deleteVideo } = useStore();
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [selfNotes, setSelfNotes] = useState(video.selfNotes ?? "");
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const blob = await loadVideoBlob(video.blobKey);
        if (cancelled || !blob) return;
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setSrc(url);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [video.blobKey]);

  function saveMeta() {
    updateVideo(video.id, {
      title: title.trim() || video.title,
      description: description.trim() || undefined,
      selfNotes: selfNotes.trim() || undefined,
    });
    setEditing(false);
  }

  function toggleReviewFlag() {
    updateVideo(video.id, {
      markedForReview: !video.markedForReview,
    });
  }

  function markReviewed() {
    updateVideo(video.id, {
      reviewedAt: new Date().toISOString(),
      markedForReview: false,
    });
  }

  function unmarkReviewed() {
    updateVideo(video.id, {
      reviewedAt: undefined,
    });
  }

  async function doDelete() {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    await deleteVideo(video.id);
    onBack();
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Library
        </button>
      </header>

      <div className="rounded-2xl overflow-hidden bg-black aspect-video">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            Loading...
          </div>
        ) : src ? (
          <video src={src} controls playsInline className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            Couldn&apos;t load video
          </div>
        )}
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="chip bg-slate-100 text-slate-700">
          {VIDEO_TAG_EMOJIS[video.tag]} {VIDEO_TAG_LABELS[video.tag]}
        </span>
        {video.audience === "coach" && (
          <span className="chip bg-purple-50 text-purple-700">
            <Eye size={12} /> For coach
          </span>
        )}
        {video.audience === "parent" && (
          <span className="chip bg-amber-50 text-amber-700">
            <Eye size={12} /> For parent
          </span>
        )}
        {video.markedForReview && !video.reviewedAt && (
          <span className="chip bg-amber-100 text-amber-800 font-bold">
            Flagged for review
          </span>
        )}
        {video.reviewedAt && (
          <span className="chip bg-green-100 text-green-800 font-bold">
            <Check size={12} strokeWidth={3} /> Reviewed
          </span>
        )}
      </div>

      {/* Meta */}
      {!editing ? (
        <div className="card">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-slate-900 text-lg">
                {video.title}
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                {new Date(video.createdAt).toLocaleString()} ·{" "}
                {formatDuration(video.durationSec) || "?"} ·{" "}
                {formatBytes(video.sizeBytes)}
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </button>
          </div>
          {video.description && (
            <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed">
              {video.description}
            </p>
          )}
          {video.selfNotes && (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                My notes
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {video.selfNotes}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card space-y-3">
          <Label>Title</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputCls + " resize-none"}
          />
          <Label>My notes</Label>
          <textarea
            value={selfNotes}
            onChange={(e) => setSelfNotes(e.target.value)}
            rows={3}
            placeholder="What did you notice? What are you working on?"
            className={inputCls + " resize-none"}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTitle(video.title);
                setDescription(video.description ?? "");
                setSelfNotes(video.selfNotes ?? "");
                setEditing(false);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={saveMeta} className="btn-primary flex-1">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Review actions */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Review</h3>
          <Sparkles size={14} className="text-brand-500" />
        </div>
        <p className="text-xs text-slate-600">
          Flag videos that need feedback. Phase 2 will let you share them
          directly with your coach or parent.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {!video.reviewedAt ? (
            <>
              <button
                onClick={toggleReviewFlag}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition ${
                  video.markedForReview
                    ? "bg-amber-100 border-amber-400 text-amber-800"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {video.markedForReview ? "✓ Flagged" : "Flag for Review"}
              </button>
              <button
                onClick={markReviewed}
                className="py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1"
              >
                <Check size={14} strokeWidth={3} /> Mark Reviewed
              </button>
            </>
          ) : (
            <button
              onClick={unmarkReviewed}
              className="col-span-2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Unmark Reviewed
            </button>
          )}
        </div>
      </div>

      <button
        onClick={doDelete}
        className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 mx-auto pt-2"
      >
        <Trash2 size={12} /> Delete video
      </button>
    </div>
  );
}

// Shared helpers
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}
const inputCls =
  "w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 outline-none transition";

// Ensure ChevronRight remains referenced for future use on list items
void ChevronRight;

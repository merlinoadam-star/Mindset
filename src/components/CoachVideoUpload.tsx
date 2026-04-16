import { useRef, useState } from "react";
import { Video, Upload, Check, X } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { uploadVideoAsCoach } from "../lib/videoSync";

/**
 * Video upload card for coaches/parents on the AthleteView. Lets them
 * record or select a video, give it a title + tag, and upload it to
 * the athlete's video library.
 */

const TAGS = [
  { value: "technique", label: "Technique" },
  { value: "drill", label: "Drill" },
  { value: "match", label: "Match Film" },
  { value: "form-check", label: "Form Check" },
  { value: "highlight", label: "Highlight" },
  { value: "other", label: "Other" },
];

const MAX_SIZE_MB = 100;

export default function CoachVideoUpload({
  athleteId,
  athleteName,
}: {
  athleteId: string;
  athleteName: string;
}) {
  const { account } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("technique");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (
    !account ||
    (account.role !== "coach" && account.role !== "parent")
  ) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large (max ${MAX_SIZE_MB}MB).`);
      return;
    }
    if (!f.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    setError(null);
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    setExpanded(true);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);
    const { error: err } = await uploadVideoAsCoach({
      athleteId,
      uploaderId: account.id,
      uploaderRole: account.role as "coach" | "parent",
      blob: file,
      title: title.trim(),
      description: description.trim() || undefined,
      tag,
    });
    setUploading(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    window.setTimeout(() => {
      setDone(false);
      setFile(null);
      setTitle("");
      setDescription("");
      setTag("technique");
      setExpanded(false);
    }, 2500);
  };

  const cancel = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setError(null);
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
            <Video size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900">
              Share a video with {athleteName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Upload a drill demo, technique clip, or match film.
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-primary !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
          >
            <Upload size={13} /> Select video
          </button>
          <button
            onClick={() => {
              setExpanded(true);
              // Trigger camera on mobile
              if (fileRef.current) {
                fileRef.current.setAttribute("capture", "environment");
                fileRef.current.click();
                fileRef.current.removeAttribute("capture");
              }
            }}
            className="btn-secondary !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
          >
            <Video size={13} /> Record
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="card border-violet-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video size={16} className="text-violet-600" />
          <div className="font-bold text-slate-900 text-sm">
            Upload for {athleteName}
          </div>
        </div>
        <button
          onClick={cancel}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
        >
          <X size={14} />
        </button>
      </div>

      {!file && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-8 border-2 border-dashed border-violet-200 rounded-xl text-sm text-violet-600 font-semibold hover:border-violet-400 hover:bg-violet-50 transition"
        >
          <Upload size={20} className="mx-auto mb-1" />
          Tap to select a video
        </button>
      )}

      {file && (
        <div className="rounded-xl bg-violet-50 border border-violet-200 px-3 py-2 text-xs text-violet-800 mb-3">
          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-3 mt-3">
        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Double leg setup drill"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1">
            Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTag(t.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                  tag === t.value
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1">
            Note for the athlete (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What should they focus on when watching?"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-600 font-medium">{error}</div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={cancel} className="btn-secondary" disabled={uploading}>
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || !title.trim() || uploading}
          className="btn-primary flex-1 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {done ? (
            <>
              <Check size={14} /> Sent!
            </>
          ) : uploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload size={14} /> Upload
            </>
          )}
        </button>
      </div>
    </div>
  );
}

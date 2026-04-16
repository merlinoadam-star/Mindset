import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Camera } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useStore } from "../lib/store";
import { extractFrames } from "../lib/videoFrames";
import {
  getCachedVideoReview,
  requestVideoReview,
} from "../lib/aiVideoReview";
import { getVideoSignedUrl } from "../lib/videoSync";

/**
 * AI Video Review card — extracts frames from a video, sends them to
 * Claude for technique analysis, and displays the result. Works for
 * both cloud-stored videos (via signed URL) and local blobs.
 */
export default function VideoReviewCard({
  videoId,
  athleteId,
  storagePath,
  localBlobUrl,
  description,
}: {
  videoId: string;
  athleteId: string;
  storagePath?: string;
  localBlobUrl?: string;
  description?: string;
}) {
  const { configured } = useAuth();
  const { state } = useStore();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const cached = await getCachedVideoReview(athleteId, videoId);
      setAnalysis(cached);
      setLoading(false);
    })();
  }, [athleteId, videoId, configured]);

  if (!configured) return null;

  const sport = state.profile?.sport ?? "wrestling";

  const generate = async (_refresh = false) => {
    setGenerating(true);
    setError(null);
    setFrameCount(0);

    try {
      // Get a playable URL for frame extraction
      let videoUrl = localBlobUrl;
      if (!videoUrl && storagePath) {
        videoUrl = (await getVideoSignedUrl(storagePath)) ?? undefined;
      }
      if (!videoUrl) {
        setError("Couldn't load the video for analysis.");
        setGenerating(false);
        return;
      }

      // Extract frames
      const frames = await extractFrames(videoUrl, 6, 0.6, 512);
      if (frames.length === 0) {
        setError("Couldn't extract frames from the video. Try a different clip.");
        setGenerating(false);
        return;
      }
      setFrameCount(frames.length);

      // Send to AI
      const { analysis: result, error: err } = await requestVideoReview({
        athleteId,
        videoId,
        frames,
        sport,
        context: description,
      });

      if (err) {
        setError(err);
      } else if (result) {
        setAnalysis(result);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card bg-gradient-to-br from-violet-50 via-purple-50 to-white border-violet-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
          <Camera size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-violet-700">
                AI Video Review
              </div>
              <div className="font-bold text-slate-900">Technique analysis</div>
            </div>
            {analysis && !generating && (
              <button
                onClick={() => generate(true)}
                className="text-[11px] text-violet-700 hover:text-violet-900 font-semibold flex items-center gap-1"
              >
                <RefreshCw size={10} /> Re-analyze
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-sm text-slate-400 mt-2">Loading...</div>
          ) : generating ? (
            <div className="text-sm text-slate-500 mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                {frameCount > 0
                  ? `Analyzing ${frameCount} frames...`
                  : "Extracting frames from video..."}
              </div>
            </div>
          ) : analysis ? (
            <div className="text-sm text-slate-800 mt-2 leading-relaxed whitespace-pre-wrap">
              {analysis}
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 mt-2 leading-snug">
                AI will watch your video and give you specific feedback on
                technique, positioning, and what to work on.
              </p>
              <button
                onClick={() => generate(false)}
                className="btn-primary mt-3 !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
              >
                <Sparkles size={12} /> Analyze my technique
              </button>
            </>
          )}

          {error && (
            <div className="text-xs text-red-600 mt-2 font-medium">
              {error}
              <button
                onClick={() => generate(false)}
                className="ml-2 text-brand-600 hover:text-brand-800 font-bold underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

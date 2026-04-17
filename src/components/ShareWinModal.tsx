import { useEffect, useState } from "react";
import { X, Share2, Check } from "lucide-react";
import { renderShareCardDataUrl, shareWin, type ShareWinData } from "../lib/shareWins";
import { hapticSuccess } from "../lib/haptics";

/**
 * Modal that previews the shareable win card and offers a Share button.
 * Uses the Web Share API when available (mobile), falls back to
 * PNG download on desktop.
 */
export default function ShareWinModal({
  data,
  onClose,
}: {
  data: ShareWinData | null;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState<"shared" | "downloaded" | null>(null);

  useEffect(() => {
    if (!data) {
      setPreview(null);
      setDone(null);
      return;
    }
    setPreview(renderShareCardDataUrl(data));
  }, [data]);

  if (!data) return null;

  const share = async () => {
    setSharing(true);
    const { shared, fallback } = await shareWin(data);
    setSharing(false);
    if (shared) {
      hapticSuccess();
      setDone(fallback === "download" ? "downloaded" : "shared");
      window.setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-elevated relative animate-pop-in">
        <button
          onClick={onClose}
          disabled={sharing}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center disabled:opacity-40"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-3">
          <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Share your win!
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Send it to your coach, parent, or teammates.
          </p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="rounded-2xl overflow-hidden shadow-elevated">
            <img
              src={preview}
              alt="Share card preview"
              className="w-full block"
            />
          </div>
        )}

        {/* Action */}
        <button
          onClick={share}
          disabled={sharing || Boolean(done)}
          className="btn-primary w-full mt-4 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {done === "shared" ? (
            <>
              <Check size={16} strokeWidth={3} /> Shared!
            </>
          ) : done === "downloaded" ? (
            <>
              <Check size={16} strokeWidth={3} /> Saved to your device
            </>
          ) : sharing ? (
            "Preparing..."
          ) : (
            <>
              <Share2 size={16} /> Share
            </>
          )}
        </button>
      </div>
    </div>
  );
}

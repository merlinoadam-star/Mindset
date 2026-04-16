/**
 * Extract N evenly-spaced frames from a video as JPEG data URLs.
 *
 * Works by loading the video into a hidden <video> element, seeking
 * to each timestamp, drawing the frame onto a <canvas>, and exporting
 * as a compressed JPEG. Runs entirely client-side — no server needed.
 */

export async function extractFrames(
  videoUrl: string,
  count = 6,
  jpegQuality = 0.6,
  maxWidth = 512
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas 2D context not available"));
      return;
    }

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || duration < 1) {
        reject(new Error("Video too short or unreadable"));
        return;
      }

      // Calculate dimensions (scale down if wider than maxWidth)
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const frames: string[] = [];
      const step = duration / (count + 1);

      for (let i = 1; i <= count; i++) {
        const time = step * i;
        try {
          const dataUrl = await seekAndCapture(
            video,
            canvas,
            ctx,
            time,
            jpegQuality
          );
          frames.push(dataUrl);
        } catch {
          // Skip frames that fail to seek
        }
      }

      resolve(frames);
    };

    video.onerror = () => reject(new Error("Failed to load video"));
    video.src = videoUrl;
  });
}

function seekAndCapture(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  time: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Seek timeout")), 5000);
    video.onseeked = () => {
      clearTimeout(timeout);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };
    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Seek error"));
    };
    video.currentTime = time;
  });
}

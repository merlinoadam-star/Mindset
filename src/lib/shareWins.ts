/**
 * Phase G — shareable win cards.
 *
 * Renders a 1080x1080 PNG card (Instagram-square) directly to a
 * canvas, then either uses the Web Share API (mobile) or downloads
 * the PNG (desktop). No library — all canvas 2D.
 */

export interface MatchWin {
  type: "match";
  athleteName: string;
  opponent: string;
  result: "W" | "L" | "T";
  myScore?: number;
  theirScore?: number;
  winType?: string;
}

export interface LevelUp {
  type: "level-up";
  athleteName: string;
  level: number;
  title: string;
}

export interface StreakMilestone {
  type: "streak";
  athleteName: string;
  days: number;
}

export interface BadgeUnlock {
  type: "badge";
  athleteName: string;
  badgeName: string;
  badgeEmoji: string;
  badgeDescription: string;
}

export type ShareWinData = MatchWin | LevelUp | StreakMilestone | BadgeUnlock;

const SIZE = 1080;

/** Paint the card onto a canvas and return it. */
function paintCanvas(data: ShareWinData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background gradient (varies by win type)
  const gradients: Record<ShareWinData["type"], [string, string]> = {
    match: ["#10b981", "#059669"],
    "level-up": ["#6366f1", "#8b5cf6"],
    streak: ["#f59e0b", "#dc2626"],
    badge: ["#a855f7", "#ec4899"],
  };
  const [c1, c2] = gradients[data.type];
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, c1);
  bg.addColorStop(1, c2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Decorative blobs
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(900, 180, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(150, 950, 260, 0, Math.PI * 2);
  ctx.fill();

  // Big emoji
  const emojis: Record<ShareWinData["type"], string> = {
    match: "🏆",
    "level-up": "⚡",
    streak: "🔥",
    badge: "🎖️",
  };
  ctx.font = "380px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const emoji = data.type === "badge" ? (data as BadgeUnlock).badgeEmoji : emojis[data.type];
  ctx.fillText(emoji, SIZE / 2, 380);

  // Headline (big bold text)
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 100px system-ui, -apple-system, sans-serif";
  let headline = "";
  let subhead = "";
  let extra = "";

  if (data.type === "match") {
    headline = "BIG WIN!";
    const scoreStr =
      data.myScore != null && data.theirScore != null
        ? ` ${data.myScore}–${data.theirScore}`
        : "";
    subhead = `vs. ${data.opponent}${scoreStr}`;
    if (data.winType) extra = data.winType.toUpperCase();
  } else if (data.type === "level-up") {
    headline = `LEVEL ${data.level}`;
    subhead = data.title;
  } else if (data.type === "streak") {
    headline = `${data.days}-DAY STREAK`;
    subhead = "On fire 🔥";
  } else if (data.type === "badge") {
    headline = "BADGE UNLOCKED";
    subhead = data.badgeName;
    extra = data.badgeDescription;
  }

  ctx.fillText(headline, SIZE / 2, 610);

  ctx.font = "700 56px system-ui, -apple-system, sans-serif";
  ctx.fillText(subhead, SIZE / 2, 700);

  if (extra) {
    ctx.font = "500 38px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    wrapText(ctx, extra, SIZE / 2, 770, SIZE - 120, 46);
  }

  // Athlete name chip
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  const nameText = data.athleteName.toUpperCase();
  ctx.font = "800 44px system-ui, -apple-system, sans-serif";
  const nameWidth = ctx.measureText(nameText).width + 80;
  const nameX = (SIZE - nameWidth) / 2;
  roundRect(ctx, nameX, 880, nameWidth, 80, 40);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(nameText, SIZE / 2, 920);

  // Mindset branding bottom
  ctx.font = "700 32px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("🔥 Mindset", SIZE / 2, 1020);

  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let dy = 0;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + dy);
      line = word;
      dy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y + dy);
}

/** Get the rendered card as a data URL (for preview in UI). */
export function renderShareCardDataUrl(data: ShareWinData): string {
  const canvas = paintCanvas(data);
  return canvas.toDataURL("image/png");
}

/** Convert canvas to Blob (needed for Web Share). */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.9);
  });
}

/** Either share via Web Share API or trigger a download. */
export async function shareWin(data: ShareWinData): Promise<{
  shared: boolean;
  fallback?: "download";
}> {
  const canvas = paintCanvas(data);
  const blob = await canvasToBlob(canvas);
  if (!blob) return { shared: false };

  const filename = `mindset-${data.type}-${Date.now()}.png`;
  const file = new File([blob], filename, { type: "image/png" });
  const title = shareTitleFor(data);
  const text = shareTextFor(data);

  // Try native share first (works on most mobile)
  try {
    const nav = navigator as unknown as {
      canShare?: (d: { files?: File[] }) => boolean;
      share?: (d: { title?: string; text?: string; files?: File[] }) => Promise<void>;
    };
    if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
      await nav.share({ title, text, files: [file] });
      return { shared: true };
    }
  } catch {
    /* user cancelled or unsupported — fall through */
  }

  // Fallback: trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { shared: true, fallback: "download" };
}

function shareTitleFor(data: ShareWinData): string {
  if (data.type === "match") return `${data.athleteName} just won!`;
  if (data.type === "level-up")
    return `${data.athleteName} hit Level ${data.level}!`;
  if (data.type === "streak")
    return `${data.athleteName} is on a ${data.days}-day streak!`;
  return `${data.athleteName} unlocked ${data.badgeName}!`;
}

function shareTextFor(data: ShareWinData): string {
  if (data.type === "match") return `vs. ${data.opponent} — big win 🏆`;
  if (data.type === "level-up") return `Level ${data.level}: ${data.title} ⚡`;
  if (data.type === "streak") return `${data.days} days in a row 🔥`;
  return `${data.badgeEmoji} ${data.badgeName}`;
}

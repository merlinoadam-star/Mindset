#!/usr/bin/env node
/**
 * Renders public/icon.svg to the PNG variants the PWA manifest
 * expects. Run with `npm run icons`.
 *
 * The SVG embeds a <text> element using Bebas Neue. To make sure
 * sharp/libvips can find that font on any machine, we install it
 * into ~/.fonts and refresh the fontconfig cache before rendering.
 * The TTF is bundled at scripts/fonts/BebasNeue-Regular.ttf so the
 * script is self-sufficient — no separate setup step required.
 *
 * Maskable variant strips the rounded-corner radius so platforms
 * that crop a circle/square don't show transparent corners.
 */
import sharp from "sharp";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

// --- 1. Make sure Bebas Neue is registered with fontconfig ---
const fontsDir = join(homedir(), ".fonts");
const installedFont = join(fontsDir, "BebasNeue-Regular.ttf");
const sourceFont = "scripts/fonts/BebasNeue-Regular.ttf";

if (!existsSync(installedFont)) {
  await mkdir(fontsDir, { recursive: true });
  await copyFile(sourceFont, installedFont);
  try {
    execSync(`fc-cache -f ${fontsDir}`, { stdio: "ignore" });
  } catch {
    // fc-cache may not be available; sharp/freetype can still
    // discover fonts in ~/.fonts on most distros.
  }
  console.log("installed Bebas Neue into", fontsDir);
}

// --- 2. Render PNG variants ---
const svg = await readFile("public/icon.svg", "utf8");

async function render(size, outPath) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(outPath, buf);
  console.log(`wrote ${outPath} (${buf.length} bytes)`);
}

await render(192, "public/icon-192.png");
await render(512, "public/icon-512.png");

// Maskable: full-bleed background (no rounded corners) so platforms
// that apply a circle/square mask don't show transparent corners.
const maskableSvg = svg.replace(
  /<rect width="512" height="512" rx="96"/,
  '<rect width="512" height="512"'
);
const maskableBuf = await sharp(Buffer.from(maskableSvg))
  .resize(512, 512)
  .png()
  .toBuffer();
await writeFile("public/icon-maskable-512.png", maskableBuf);
console.log(`wrote public/icon-maskable-512.png (${maskableBuf.length} bytes)`);

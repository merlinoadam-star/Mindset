#!/usr/bin/env node
/**
 * Renders public/icon.svg to the PNG variants the PWA manifest
 * expects. Run with `node scripts/render-icons.mjs`.
 *
 * Maskable variant uses an extended slate background so the icon
 * survives the platform's safe-area mask (the F itself is already
 * inside the safe zone of the SVG, so we just paint the bg edge-to-
 * edge instead of the rounded square).
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("public/icon.svg", "utf8");

// Standard "any" icons — keep the rounded-corner background.
async function render(size, outPath) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(outPath, buf);
  console.log(`wrote ${outPath} (${buf.length} bytes)`);
}

await render(192, "public/icon-192.png");
await render(512, "public/icon-512.png");

// Maskable: same artwork but with a full-bleed slate background so
// platforms that crop a circle/square mask don't show a transparent
// gap at the corners.
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

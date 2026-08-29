#!/usr/bin/env node
/**
 * Regenerate public/og.png, the social preview card.
 *
 * Run manually after a brand or title change: `node scripts/make-og.mjs`.
 * The PNG is committed so CI does not need image tooling or fonts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mark = fs.readFileSync(path.join(siteRoot, "src/assets/vaybel-icon.svg"));

const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f37053"/>
      <stop offset="100%" stop-color="#ffb733"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#141414"/>
  <rect x="0" y="0" width="1200" height="4" fill="url(#brand)"/>
  <text x="80" y="330" font-family="Inter" font-size="82" font-weight="700"
        letter-spacing="-2" fill="#ffffff">Vaybel <tspan fill="url(#brand)">Skills</tspan></text>
  <text x="80" y="392" font-family="Inter" font-size="30" font-weight="400" fill="#b0b0b0">
    Agent skills that run your print-on-demand store.
  </text>
  <text x="80" y="436" font-family="Inter" font-size="30" font-weight="400" fill="#b0b0b0">
    Trend, launch, optimize, content — through public MCP.
  </text>
  <rect x="80" y="490" width="470" height="56" rx="10" fill="#1f1f1f" stroke="#2e2e2e"/>
  <text x="104" y="527" font-family="SFMono-Regular, Menlo, monospace" font-size="24" fill="#f19d2a">
    /vaybel:launch-product
  </text>
</svg>`;

const markPng = await sharp(mark).resize({ height: 150 }).png().toBuffer();

await sharp(Buffer.from(card))
  .composite([{ input: markPng, top: 96, left: 80 }])
  .png()
  .toFile(path.join(siteRoot, "public/og.png"));

console.log("Wrote public/og.png");

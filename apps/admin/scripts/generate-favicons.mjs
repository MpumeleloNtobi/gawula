// Generates the Gawula favicon raster set from assets/brand-icon.svg.
// Run with: corepack pnpm --filter @foyer/admin favicons
//
// Outputs (into apps/admin/public):
//   favicon.ico        multi-resolution 16/32/48
//   icon-48.png        48x48
//   icon-96.png        96x96
//   icon-192.png       192x192
//   icon-512.png       512x512  (PWA / maskable)
//   apple-touch-icon.png  180x180
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = join(root, "assets", "brand-icon.svg");
const outDir = join(root, "public");

const pngSizes = [
  { size: 48, name: "icon-48.png" },
  { size: 96, name: "icon-96.png" },
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

const icoSizes = [16, 32, 48];

async function renderPng(svg, size) {
  return sharp(svg).resize(size, size, { fit: "contain" }).png().toBuffer();
}

async function main() {
  const svg = await readFile(src);

  await Promise.all(
    pngSizes.map(async ({ size, name }) => {
      const buf = await renderPng(svg, size);
      await writeFile(join(outDir, name), buf);
      console.log(`wrote public/${name}`);
    }),
  );

  const icoBuffers = await Promise.all(icoSizes.map((s) => renderPng(svg, s)));
  const ico = await pngToIco(icoBuffers);
  await writeFile(join(outDir, "favicon.ico"), ico);
  console.log("wrote public/favicon.ico (16/32/48)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

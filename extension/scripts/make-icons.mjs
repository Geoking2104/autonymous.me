/**
 * Génération des icônes PNG depuis le SVG du repo (about-header-freedoms.svg
 * non requis — glyphe simple ◈ sur fond dégradé bleu nuit).
 * Usage : node scripts/make-icons.mjs   (nécessite sharp, sinon copie SVG)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "icons"), { recursive: true });

// Icône vectorielle : losange doré sur dégradé bleu nuit, style site.
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0A1930"/>
      <stop offset="1" stop-color="#04101F"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>
  <path d="M64 22 L106 64 L64 106 L22 64 Z" fill="none" stroke="#E8A020" stroke-width="7" stroke-linejoin="round"/>
  <circle cx="64" cy="64" r="9" fill="#00C9A7"/>
</svg>`;

for (const size of [16, 32, 48, 128]) {
  const p = join(root, "icons", `icon-${size}.png`);
  try {
    // sharp disponible ? (dev dependency optionnelle)
    const sharp = (await import("sharp")).default;
    await sharp(Buffer.from(svg(size)))
      .resize(size, size)
      .png()
      .toFile(p);
    console.log(`icon-${size}.png (sharp)`);
  } catch {
    // fallback : écrire le SVG, conversion manuelle à la première soumission
    writeFileSync(join(root, "icons", `icon-${size}.svg`), svg(size));
    console.log(`icon-${size}.svg (fallback — convertissez en PNG)`);
  }
}

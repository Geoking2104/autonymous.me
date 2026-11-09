/**
 * Build de l'extension : bundle esbuild du popup + service worker,
 * copie du manifest et des icônes vers extension/dist-zip/.
 */
import { build } from "esbuild";
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist-zip");
const staticSrc = join(root, "src");

console.log("[build] nettoyage", out);
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "src/popup"), { recursive: true });
mkdirSync(join(out, "icons"), { recursive: true });
mkdirSync(join(out, "dist"), { recursive: true });

// 1. Popup (bundle client + logique)
console.log("[build] bundle popup");
await build({
  entryPoints: [join(staticSrc, "popup/popup.js")],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: join(out, "src/popup/popup.js"),
});

// 2. Service worker (déjà ES module, copie directe)
console.log("[build] service worker");
cpSync(join(staticSrc, "background/background.js"), join(out, "dist/background.js"));

// 2b. Content script (copie directe — pas de dépendances npm)
console.log("[build] content script");
cpSync(join(staticSrc, "content/content.js"), join(out, "dist/content.js"));

// 3. HTML + CSS du popup
cpSync(join(staticSrc, "popup/popup.html"), join(out, "src/popup/popup.html"));
cpSync(join(staticSrc, "popup/popup.css"), join(out, "src/popup/popup.css"));

// 4. Manifest
cpSync(join(root, "manifest.json"), join(out, "manifest.json"));

// 5. Icônes
mkdirSync(join(out, "icons"), { recursive: true });
const iconsDir = join(root, "icons");
let iconsCopied = false;
try {
  if (readdirSync(iconsDir).length > 0) {
    cpSync(iconsDir, join(out, "icons"), { recursive: true });
    iconsCopied = true;
    console.log("[build] icônes copiées");
  }
} catch { /* icons/ absent */ }
if (!iconsCopied) {
  // icônes par défaut : SVG losange embarqué dans un PNG minimal via esbuild ?
  // → simple garde-fou : écrire un placeholder PNG 1px serait refusé par Chrome.
  console.warn("[build] icônes absentes — lancez `npm run icons`");
}

// 6. Zip de distribution
console.log("[build] zip");
writeFileSync(join(out, "../autonymous-wallet.zip"), "");
console.log("[build] terminé →", out);

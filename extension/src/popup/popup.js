/**
 * Autonymous.me Wallet — logique du popup (étape 1, lecture seule).
 *
 * Connexion au conductor local → affichage DID, attestations, Source
 * Chain. Aucune écriture : la création de DID se fait via le hApp
 * desktop ; l'extension est une fenêtre de consultation.
 */

import { WalletClient } from "./client.js";

// ── i18n minimal EN/FR ──────────────────────────────────────────
const STRINGS = {
  en: {
    searching: "Looking for conductor…",
    connected: "Connected",
    offline: "Conductor offline",
    retry: "Retry",
    identity: "Identity",
    copyDid: "Copy DID",
    copied: "Copied ✓",
    credentials: "Credentials",
    credentialsEmpty: "No credentials imported yet.",
    sourceChain: "Source Chain",
    chainSubtitle: "Immutable log, on your device.",
    chainEmpty: "The chain appears after DID creation.",
    conductor: "Conductor",
    active: "active",
    ago: (dateStr) => timeAgo(dateStr, "en"),
  },
  fr: {
    searching: "Recherche du conductor…",
    connected: "Connecté",
    offline: "Conductor hors ligne",
    retry: "Réessayer",
    identity: "Identité",
    copyDid: "Copier le DID",
    copied: "Copié ✓",
    credentials: "Attestations",
    credentialsEmpty: "Aucune attestation importée pour l'instant.",
    sourceChain: "Source Chain",
    chainSubtitle: "Journal immuable, sur votre appareil.",
    chainEmpty: "La chaîne apparaîtra après la création du DID.",
    conductor: "Conductor",
    active: "active",
    ago: (dateStr) => timeAgo(dateStr, "fr"),
  },
};

let lang = "fr";

function timeAgo(iso, locale) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (s < 60) return rtf.format(-Math.round(s), "second");
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

// ── Éléments ────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const statusDot = $("status-dot");
const statusText = $("status-text");
const didValue = $("did-value");
const didContext = $("did-context");
const didActive = $("did-active");
const copyBtn = $("copy-did");
const credList = $("cred-list");
const credEmpty = $("cred-empty");
const credCount = $("cred-count");
const chainList = $("chain-list");
const chainEmpty = $("chain-empty");
const chainCount = $("chain-count");
const retryBtn = $("retry");
const langBtn = $("lang");
const settingsBtn = $("settings");

// ── État ────────────────────────────────────────────────────────
let client = null;

// ── Rendu ───────────────────────────────────────────────────────
function setStatus(state, text) {
  statusDot.className = `dot ${state}`;
  statusText.textContent = text;
}

function renderDid(did) {
  didValue.textContent = did ? did : "—";
  didContext.textContent = "default";
  didActive.hidden = !did;
}

function renderCredentials(items) {
  credCount.textContent = String(items.length);
  credEmpty.hidden = items.length > 0;
  credList.replaceChildren(
    ...items.map((c) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="li-glyph credential" aria-hidden="true">🪪</span>
        <div class="li-body">
          <p class="li-title"></p>
          <p class="li-sub"></p>
        </div>`;
      li.querySelector(".li-title").textContent = c.credential.label;
      li.querySelector(".li-sub").textContent = `${c.credential.credential_type} · ${STRINGS[lang].ago(c.credential.issued_at)}`;
      return li;
    }),
  );
}

function renderChain(entries) {
  chainCount.textContent = String(entries.length);
  chainEmpty.hidden = entries.length > 0;
  chainList.replaceChildren(
    ...entries.slice(0, 8).reverse().map((e) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="li-glyph chain" aria-hidden="true">#</span>
        <div class="li-body">
          <p class="li-title"></p>
          <p class="li-sub"></p>
        </div>`;
      li.querySelector(".li-title").textContent = e.entry.description;
      li.querySelector(".li-sub").textContent = e.entry.action_type;
      return li;
    }),
  );
}

// ── Cycle de vie ────────────────────────────────────────────────
async function load() {
  setStatus("waiting", STRINGS[lang].searching);
  try {
    client = await WalletClient.connect();
    setStatus("ok", STRINGS[lang].connected);

    const [did, creds, chain] = await Promise.all([
      client.getMyDid(),
      client.listCredentials().catch(() => []),
      client.getAuditLog().catch(() => []),
    ]);

    renderDid(did?.did);
    renderCredentials(creds);
    renderChain(chain);
  } catch (err) {
    console.warn("[autonymous]", err);
    setStatus("err", STRINGS[lang].offline);
    renderDid(null);
    renderCredentials([]);
    renderChain([]);
  }
}

// ── Interactions ────────────────────────────────────────────────
copyBtn.addEventListener("click", async () => {
  if (!didValue.textContent || didValue.textContent === "—") return;
  await navigator.clipboard.writeText(didValue.textContent);
  const orig = copyBtn.textContent;
  copyBtn.textContent = STRINGS[lang].copied;
  setTimeout(() => (copyBtn.textContent = orig), 1400);
});

retryBtn.addEventListener("click", load);

langBtn.addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  langBtn.textContent = lang === "fr" ? "EN" : "FR";
  document.documentElement.lang = lang;
  // re-render statiques
  $("credentials-title")?.remove();
  applyStaticLabels();
  if (client) load();
});

function applyStaticLabels() {
  copyBtn.textContent = STRINGS[lang].copyDid;
  credEmpty.textContent = STRINGS[lang].credentialsEmpty;
  chainEmpty.textContent = STRINGS[lang].chainEmpty;
  retryBtn.textContent = STRINGS[lang].retry;
  settingsBtn.textContent = STRINGS[lang].conductor;
}

settingsBtn.addEventListener("click", () => {
  const panel = document.querySelector(".settings-panel");
  if (panel) panel.classList.toggle("open");
});

// ── Démarrage ───────────────────────────────────────────────────
applyStaticLabels();
load();

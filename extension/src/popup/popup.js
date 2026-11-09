/**
 * Autonymous.me Wallet — logique du popup (étape 1, lecture seule).
 *
 * Connexion au conductor local → affichage DID, attestations, Source
 * Chain. Aucune écriture : la création de DID se fait via le hApp
 * desktop ; l'extension est une fenêtre de consultation.
 */

import { WalletClient } from "./client.js";
import { PresentFlow } from "./present-flow.js";

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
    willShare: "will be shared",
    willHide: "hidden",
    sending: "Presenting…",
    presentOk: "Verified ✓",
    presentFail: "Delivery failed",
    bannerTitle: "Verification request",
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
    willShare: "sera transmis",
    willHide: "masqué",
    sending: "Présentation…",
    presentOk: "Vérifié ✓",
    presentFail: "Échec d'envoi",
    bannerTitle: "Requête de vérification",
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
checkPendingRequest();

/**
 * Orchestrations Ã©tape 2 â€” injectÃ©es en fin de popup.js
 * (banniÃ¨re requÃªte pendante + vue PrÃ©sentation OpenID4VP).
 */

// â”€â”€ RequÃªte OpenID4VP pendante â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function checkPendingRequest() {
  chrome.storage.local.get(["pendingRequest"], ({ pendingRequest }) => {
    if (!pendingRequest?.raw) return;
    requestBanner.hidden = false;
    try {
      bannerSource.textContent = pendingRequest.source?.host
        ? pendingRequest.source.host
        : new URL(pendingRequest.raw).host;
    } catch {
      bannerSource.textContent = "â€”";
    }
  });
}

requestBanner.addEventListener("click", () => openPresentView());

// â”€â”€ Vue PrÃ©sentation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function openPresentView() {
  const { pendingRequest } = await chrome.storage.local.get(["pendingRequest"]);
  if (!pendingRequest?.raw) return;

  setStatus("waiting", STRINGS[lang].searching);
  try {
    client = client ?? (await WalletClient.connect());
    setStatus("ok", STRINGS[lang].connected);
  } catch {
    setStatus("err", STRINGS[lang].offline);
    return;
  }

  try {
    const creds = await client.listCredentials();
    if (!creds?.length) throw new Error("no-credential");
    const cred = creds[0]; // Ã©tape 2 : premier credential (sÃ©lection multiple plus tard)

    presentFlow = new PresentFlow(client, { onDone: backToMain });
    const parsed = await presentFlow.begin(pendingRequest.raw, {
      label: cred.credential.label,
      credential_id: cred.action_hash,
      token: cred.credential.token,
      available_claims: parseClaims(cred.credential.available_claims),
    });
    renderPresentView(parsed, pendingRequest.source);
  } catch (err) {
    console.warn("[autonymous] present", err);
    setStatus(
      "err",
      err?.message === "no-credential"
        ? STRINGS[lang].credentialsEmpty
        : String(err?.message ?? err),
    );
  }
}

function parseClaims(rawClaims) {
  if (Array.isArray(rawClaims)) return rawClaims;
  if (typeof rawClaims === "string" && rawClaims.length > 0) {
    try {
      return JSON.parse(rawClaims);
    } catch {
      return rawClaims.split(",").map((s) => s.trim());
    }
  }
  return [];
}

function renderPresentView(parsed, source) {
  const view = $("view");
  const tpl = document.getElementById("present-view");
  view.replaceChildren(tpl.content.cloneNode(true));

  $("pv-verifier-name").textContent = source?.title ?? parsed.request.client_id;
  $("pv-verifier-id").textContent = parsed.request.client_id;

  const list = $("pv-claims");
  const states = presentFlow.claimState();
  list.replaceChildren(
    ...states.map((c) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="li-body">
          <p class="claim-name"></p>
          <p class="claim-state"></p>
        </div>
        <button class="claim-toggle" role="switch" aria-checked="false"></button>`;
      li.querySelector(".claim-name").textContent = c.name;
      const stateEl = li.querySelector(".claim-state");
      const tog = li.querySelector(".claim-toggle");
      const paint = () => {
        tog.setAttribute("aria-checked", String(c.selected));
        stateEl.textContent = c.selected
          ? STRINGS[lang].willShare
          : STRINGS[lang].willHide;
        stateEl.classList.toggle("on", c.selected);
      };
      paint();
      tog.addEventListener("click", () => {
        if (presentFlow.toggle(c.name)) paint();
      });
      return li;
    }),
  );

  $("pv-approve").addEventListener("click", approvePresentation);
  $("pv-deny").addEventListener("click", denyPresentation);
}

async function approvePresentation() {
  const btn = $("pv-approve");
  btn.disabled = true;
  const result = $("pv-result");
  result.hidden = false;
  $("pv-result-text").textContent = STRINGS[lang].sending;
  $("pv-result-text").className = "result-text";
  try {
    const r = await presentFlow.approve();
    const txt = $("pv-result-text");
    if (r.ok) {
      txt.textContent = STRINGS[lang].presentOk;
      txt.className = "result-text ok";
      chrome.runtime.sendMessage({ type: "CLEAR_PENDING" });
      setTimeout(() => backToMain(), 1200);
    } else {
      txt.textContent = `${STRINGS[lang].presentFail}${r.error ? ` (${r.error})` : ""}`;
      txt.className = "result-text err";
      btn.disabled = false;
    }
  } catch (err) {
    const txt = $("pv-result-text");
    txt.textContent = String(err?.message ?? err);
    txt.className = "result-text err";
    btn.disabled = false;
  }
}

async function denyPresentation() {
  try {
    await presentFlow.deny();
  } catch {
    /* la prÃ©sentation est dÃ©jÃ  journalisÃ©e ou le conductor est parti */
  }
  chrome.runtime.sendMessage({ type: "CLEAR_PENDING" });
  backToMain();
}

function backToMain() {
  location.reload(); // retour propre Ã  la vue principale
}


/**
 * Autonymous.me Wallet — background service worker (MV3).
 *
 * Étape 2 : relais des requêtes OpenID4VP détectées par le content script,
 * stockage de la requête pendante, badge d'activité.
 */

const CONDUCTOR_WS = "ws://localhost:8888";

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
  chrome.storage.local.set({ conductorUrl: CONDUCTOR_WS });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_CONFIG") {
    chrome.storage.local.get(["conductorUrl"], (cfg) => {
      sendResponse({ conductorUrl: cfg.conductorUrl ?? CONDUCTOR_WS });
    });
    return true; // réponse asynchrone
  }

  if (msg?.type === "OPENID4VP_REQUEST") {
    chrome.storage.local.set({
      pendingRequest: {
        raw: msg.raw,
        source: msg.source ?? null,
        receivedAt: Date.now(),
      },
    });
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#E8A020" });
    // action.open() exige un geste utilisateur : le badge doré invite à
    // cliquer sur l'icône du wallet pour ouvrir le flux de présentation.
    sendResponse({ ok: true });
    return false;
  }

  if (msg?.type === "OPENID4VP_AVAILABLE") {
    chrome.action.setBadgeText({ text: "•" });
    chrome.action.setBadgeBackgroundColor({ color: "#8E8E93" });
    return false;
  }

  if (msg?.type === "CLEAR_PENDING") {
    chrome.storage.local.remove("pendingRequest");
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

/**
 * Autonymous.me Wallet — background service worker (MV3).
 *
 * Étape 1 : gestion minimale — badge de connexion conductor + relais de
 * l'état vers le popup. Aucune cryptographie ici : la signature vit dans
 * Lair via le conductor local (option A).
 */

const CONDUCTOR_WS = "ws://localhost:8888";

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
  chrome.storage.local.set({ conductorUrl: CONDUCTOR_WS });
});

// Le popup est éphémère : il demande l'état au SW à l'ouverture.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_CONFIG") {
    chrome.storage.local.get(["conductorUrl"], (cfg) => {
      sendResponse({ conductorUrl: cfg.conductorUrl ?? CONDUCTOR_WS });
    });
    return true; // réponse asynchrone
  }
  return false;
});

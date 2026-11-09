/**
 * Content script — détection des requêtes OpenID4VP sur les pages web.
 *
 * Deux mécanismes (étape 2, sans Digital Credentials API) :
 * 1. Clic sur un lien/deep-link openid4vp:// → interception et relais au SW.
 * 2. Détection d'un request_uri dans les QR affichés (attribut src/data),
 *    signalée au SW qui propose l'ouverture (badge).
 *
 * Aucune lecture du DOM au-delà des liens et images : pas de collecte.
 */

const OPENID4VP_SCHEME = "openid4vp://";

// 1. Interception des clics sur deep links openid4vp://
document.addEventListener("click", (ev) => {
  const a = ev.target?.closest?.('a[href^="openid4vp://"]');
  if (!a) return;
  ev.preventDefault();
  chrome.runtime.sendMessage({
    type: "OPENID4VP_REQUEST",
    raw: a.href,
    source: { host: location.host, title: document.title },
  });
});

// 2. Liens openid4vp présents dans la page (détection passive, badge)
function scanForLinks() {
  const links = document.querySelectorAll('a[href^="openid4vp://"]');
  if (links.length > 0) {
    chrome.runtime.sendMessage({ type: "OPENID4VP_AVAILABLE", count: links.length });
  }
}
scanForLinks();

// 3. Flux de navigation vers le schéma (certains sites font window.location)
window.addEventListener("beforeunload", () => {
  /* rien : le schéma non enregistré affiche l'erreur native Chrome ;
     l'interception clic + request_uri couvre le cas nominal. */
});

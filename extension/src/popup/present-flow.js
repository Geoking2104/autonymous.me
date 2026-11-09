/**
 * Vue Présentation — flux OpenID4VP complet dans le popup (étape 2).
 *
 * Cycle : requête entrante (deep link openid4vp:// intercepté par le SW)
 * → parsing zome (nonce, client_id, required_claims)
 * → sélecteur de claims (toggles, pré-activés = minimum requis)
 * → build_vp_token (dc+sd-jwt, holder binding dans Lair)
 * → POST direct à response_uri (direct_post, aucun redirect)
 * → record_presentation (journal Source Chain).
 */

import { WalletClient } from "./client.js";

export class PresentFlow {
  /**
   * @param {WalletClient} client
   * @param {{ onDone: () => void }} hooks
   */
  constructor(client, hooks = {}) {
    this.client = client;
    this.onDone = hooks.onDone ?? (() => {});
    this.parsed = null;   // ParseRequestOutput
    this.credential = null; // credential choisi
    this.selection = new Set(); // claims activés
  }

  /**
   * Point d'entrée : URI brute openid4vp://... ou JSON.
   * @param {string} raw
   * @param {{label:string, credential_type:string, credential_id:string, token:string, available_claims:string[]}} credential
   */
  async begin(raw, credential) {
    this.parsed = await this.client.parseAuthorizationRequest(raw);
    this.credential = credential;

    // Pré-sélection : le strict minimum exigé par le vérifieur
    this.selection = new Set(this.parsed.required_claims ?? []);
    return this.parsed;
  }

  /** Liste des claims disponibles avec leur état. */
  claimState() {
    const all = this.credential.available_claims ?? [];
    return all.map((name) => ({
      name,
      required: this.parsed.required_claims?.includes(name) ?? false,
      selected: this.selection.has(name),
    }));
  }

  /**
   * Bascule un claim (les claims requis ne peuvent pas être désactivés).
   * @param {string} name
   */
  toggle(name) {
    if (this.parsed.required_claims?.includes(name)) return false;
    if (this.selection.has(name)) this.selection.delete(name);
    else this.selection.add(name);
    return true;
  }

  /**
   * Approve : construit le VP Token, l'envoie en direct_post, journalise.
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  async approve() {
    const req = this.parsed.request;
    const out = await this.client.buildVpToken({
      nonce: req.nonce,
      credential_id: this.credential.credential_id,
      sd_jwt_token: this.credential.token,
      disclosed_claims: [...this.selection],
      all_claims: this.credential.available_claims ?? [],
      client_id: req.client_id,
    });

    // direct_post : POST form-urlencoded, aucun redirect (FR-OID-04)
    let delivered = false;
    let postError = "";
    if (req.response_uri) {
      try {
        const body = new URLSearchParams({
          vp_token: out.vp_token,
          presentation_submission: JSON.stringify({
            definition_id: "presentation_definition",
            descriptor_map: [],
          }),
        });
        const resp = await fetch(req.response_uri, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        delivered = resp.ok;
        if (!delivered) postError = `HTTP ${resp.status}`;
      } catch (e) {
        postError = String(e?.message ?? e);
      }
    }

    // Journal Source Chain dans tous les cas (FR-OID-06)
    await this.client.recordPresentation({
      nonce: req.nonce,
      verifier: req.client_id,
      disclosed_claims: out.disclosed,
      withheld_claims: out.withheld,
      vp_token: out.vp_token,
      outcome: delivered ? "approved" : "denied",
    });

    return delivered
      ? { ok: true }
      : { ok: false, error: postError || "no response_uri" };
  }

  /** Refus : journalise le refus (claims vides, outcome denied). */
  async deny() {
    const req = this.parsed.request;
    await this.client.recordPresentation({
      nonce: req.nonce,
      verifier: req.client_id,
      disclosed_claims: [],
      withheld_claims: this.credential.available_claims ?? [],
      vp_token: "",
      outcome: "denied",
    });
    this.onDone();
  }
}

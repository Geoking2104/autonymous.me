/**
 * Autonymous.me Wallet — client conductor pour le popup.
 *
 * Version allégée de ui/src/client.ts, adaptée au contexte extension :
 * - pas d'import de @holochain/client (le bundle esbuild l'embarquera) ;
 * - appels typés vers les zomes identity_wallet uniquement (étape 1,
 *   lecture seule : DID, attestations, Source Chain).
 */

const APP_ID = "autonymous_me";
const DNA_ROLE = "autonymous";

export const DidRecord = undefined; // types-only marker

/**
 * @typedef {import("@holochain/client").AppWebsocket} AppWebsocket
 * @typedef {import("@holochain/client").AppInfo} AppInfo
 * @typedef {import("@holochain/client").AgentPubKey} AgentPubKey
 * @typedef {import("@holochain/client").ActionHash} ActionHash
 */

export class WalletClient {
  /** @param {AppWebsocket} ws @param {AgentPubKey} myPubKey */
  constructor(ws, myPubKey) {
    this.ws = ws;
    this.myPubKey = myPubKey;
  }

  /**
   * Connexion au conductor local via l'app interface.
   * @param {string} url
   */
  static async connect(url = "ws://localhost:8888") {
    const { AppWebsocket } = await import("@holochain/client");
    const ws = await AppWebsocket.connect({
      url: new URL(url),
      wsClientOptions: { origin: "chrome-extension://autonymous" },
    });
    const info = await ws.appInfo();
    const roleCells = info.cell_info[APP_ID] ?? info.cell_info[DNA_ROLE];
    if (!roleCells || roleCells.length === 0) {
      throw new Error(`hApp '${APP_ID}' is not installed`);
    }
    const provisioned = roleCells.find(
      /** @param {any} c */ (c) => c.type === "provisioned",
    );
    if (!provisioned) {
      throw new Error(`hApp '${APP_ID}' has no provisioned cell`);
    }
    return new WalletClient(ws, provisioned.value.cell_id[0]);
  }

  /**
   * Appel de zome typé.
   * @param {string} zome @param {string} fn @param {unknown} payload @template T
   * @returns {Promise<T>}
   */
  async call(zome, fn, payload) {
    const result = await this.ws.callZome({
      role_name: DNA_ROLE,
      zome_name: zome,
      fn_name: fn,
      payload,
      provenance: this.myPubKey,
    });
    return result;
  }

  // ── identity_wallet : lecture seule (étape 1) ────────────────

  /** @returns {Promise<{did:string, context:string, active:boolean} | null>} */
  async getMyDid() {
    return this.call("identity_wallet", "get_my_did", null);
  }

  /** @returns {Promise<{entry:{action_type:string, description:string}}[]>} */
  async getAuditLog() {
    return this.call("identity_wallet", "get_audit_log", null);
  }

  /** @returns {Promise<{credential:{label:string, credential_type:string, issuer_did:string, issued_at:string}}[]>} */
  async listCredentials() {
    return this.call("identity_wallet", "list_credentials", null);
  }
}

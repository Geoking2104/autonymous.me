# Autonymous.me

> **Self-sovereign identity on Holochain · eIDAS 2.0 · OpenID4VP · W3C DID/VC · Apache 2.0**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![eIDAS 2.0](https://img.shields.io/badge/eIDAS-2.0%20compliant-7B68EE)](https://eur-lex.europa.eu/eli/reg/2024/1183/oj)
[![OpenID4VP](https://img.shields.io/badge/OpenID4VP-v1.0%20Final-00C9A7)](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
[![W3C DID](https://img.shields.io/badge/W3C%20DID-1.0-E8A020)](https://www.w3.org/TR/did-core/)
[![Status](https://img.shields.io/badge/Status-v0.5.1--alpha-orange)](https://github.com/Geoking2104/autonymous.me)

---

Autonymous.me is an **open-source, non-profit, community-governed protocol** for self-sovereign identity (SSI). It lets you prove who you are — your age, address, credentials — without handing over your personal data to any company, server, or database.

**No central database. No data brokers. No single point of failure.**

This repository is the **single unified home** of the project, merged on 2026-11-09:

- **The website** (this root, served by GitHub Pages): <https://geoking2104.github.io/autonymous.me/>
- **The hApp code** (full history imported from the former `Geoking2104/AutonymousMe` repo): four Holochain 0.7.1 zomes, the zk age-check circuit, the verifier SDK, the REST API, the wallet UI, and the multi-agent test suite — all CI-green.

The former `AutonymousMe` repository is now consolidated here and will be archived.

---

## Current status: Holochain 0.7.1 — four zomes (Phase 4 issuer registry included), ZK circuit, SDK, REST API, multi-agent verification all green

This repository has moved from specification to working, independently-verified code, and has been migrated from Holochain 0.4 to **Holochain 0.7** (kitsune2 + iroh/QUIC, action model `header`+`data`, hdk 0.7.1 / hdi 0.8.1, @holochain/client 0.21) — after an intermediate, fully-verified stop on 0.6:

- Four Holochain zomes (`identity_wallet`, `openid4vp`, `zk_prover`, `issuer_registry`) in Rust against HDK 0.7.1 / HDI 0.8.1. All four compile to wasm32-unknown-unknown in release mode (with the `--cfg getrandom_backend="custom"` flag) and pass 15 integration/unit tests + clippy `-D warnings`. The 0.7 action-model rewrite is applied: `validate` callbacks flatten the `Op` and match on the typed `FlatOp::CreateEntry` — stricter than the old raw-bytes probing.
- A Circom `age_check` circuit (age ≥ 18, Groth16 over BN254) with real prove/verify scripts — development trusted-setup only.
- A Holochain-backed REST API (Node/Express; spec section 8) **verified end-to-end against real conductors on both 0.6.1 and 0.7.1** (`api/scripts/verify-conductor-06.mjs` / `verify-conductor-07.mjs`).
- **Multi-agent scenario (tests/)**: a Tryorama 2-agent scenario spins up two independent conductors on a mem network and runs the full holder flow plus the issuer-registry vertical slice (register, resolve, list, duplicate-guard) — all green on 0.7.1.

What remains: the wallet UI (`ui/`) compiles (client 0.21, type-checked with `tsc --noEmit` + vite build) but has not yet been re-verified interactively against the current zomes; the zk circuit's trusted setup is dev-only and explicitly not production-safe (see `circuits/age_check/README.md`).

If you are evaluating this project for a contribution, a partnership, or an eIDAS 2.0 compliance need: get in touch via [Issues](https://github.com/Geoking2104/autonymous.me/issues) or support@autonymous.me.

---

## Why it exists

Online identity is broken by design. Every time you prove your age, address or diploma online, you hand a photocopy of your most sensitive documents to a private server that stores, sells, or eventually loses them.

Autonymous.me eliminates this model at the protocol level:

- Credentials live **on your device**, in your own Holochain Source Chain.
- Proofs are generated **locally** — zero-knowledge for attributes like age.
- **No personal data is ever transmitted** — only cryptographic proofs.
- Every action is logged on **your own tamper-proof audit chain**.

The protocol is fully compliant with eIDAS 2.0 (Reg. EU 2024/1183), W3C DID 1.0, W3C VC 2.0, OpenID4VP v1.0 Final, and SD-JWT RFC 9901 — extended with zk-SNARKs for privacy-preserving attribute disclosure.

---

## How it works

```
 Issuer (gov, university, bank)          You (Wallet hApp)              Verifier
        │                                      │                            │
        │  signs SD-JWT credential             │                            │
        ├─────────────────────────────────────▶│  stored on your device     │
        │                                      │                            │
        │                                      │  you choose what to share  │
        │                                      ├───────────────────────────▶│  OpenID4VP request
        │                                      │  VP Token (dc+sd-jwt)      │  verified instantly
        │                                      │                            │  zero data retention
```

Three steps, no technical knowledge required:

1. **Create your Digital ID** — a `did:hc:` DID generated on-device.
2. **Choose what to share** — selective disclosure at the cryptographic level.
3. **Verified, instantly** — online or offline, in under 3 seconds.

---

## Architecture

Six layers (L1 → L6): Holochain network → DIDs → zero-knowledge proofs → verifiable credentials (SD-JWT) → hApp zomes → OpenID4VP protocol handler. Full system diagram in [`docs/architecture/`](docs/architecture/) (v0.4-alpha drawio + exports).

### The five protocol building blocks

| # | Building block | Role | Standard / Tech |
|---|----------------|------|-----------------|
| 1 | **DIDs + Verifiable Credentials** | Decentralized Identifiers for people & organizations; credentials signed by issuers, stored only by you | [W3C DID 1.0](https://www.w3.org/TR/did-core/) · [W3C VC 2.0](https://www.w3.org/TR/vc-data-model-2.0/) |
| 2 | **Holochain** | Agent-centric P2P — no global blockchain; personal Source Chain + peer-validated DHT | [Holochain](https://holochain.org) |
| 3 | **OpenID4VP + SD-JWT** | Verifiable presentations with selective disclosure; eIDAS 2.0 / EUDI-wallet compatible | [OpenID4VP v1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html) · [SD-JWT RFC 9901](https://www.rfc-editor.org/rfc/rfc9901) |
| 4 | **Autonymous.me hApp** | The wallet users install — keys, credentials, sharing controls | this repo, `dnas/` + `ui/` |
| 5 | **Issuer & Verifier ecosystem** | Issuers sign credentials; verifiers request only the claims they need | `issuer_registry` zome + `api/` + `sdk/` |

---

## Standards compliance

| Standard | Status | Where |
|----------|--------|-------|
| W3C DID 1.0 | Implemented (`did:hc:` method) | `dnas/core/zomes/identity_wallet/` |
| W3C VC Data Model 2.0 | Implemented (SD-JWT VC format) | `dnas/core/zomes/openid4vp/` |
| OpenID4VP v1.0 Final | Implemented (request parse → VP Token dc+sd-jwt → callback) | `dnas/core/zomes/openid4vp/` + `api/` |
| SD-JWT (RFC 9901) | Implemented (salted-hash selective disclosure) | zomes + `sdk/` |
| zk-SNARK age proof (Groth16) | Implemented, dev trusted-setup | `circuits/age_check/` |
| eIDAS 2.0 (Reg. EU 2024/1183) | Design-ready; production certification is roadmap phase 6 | docs + `docs/architecture/` |
| GDPR Art. 15–22 | Zero-server-data by design; GDPR notice on the website | website + `docs/` |

---

## Project structure

```
autonymous.me/                       ← this repo (website at root + hApp code)
│
│  ── Website (GitHub Pages) ──
│  index.html                        ← standalone marketing site (EN/FR, no build step)
│  autonymous-standalone.html        ← working copy of the standalone site
│
│  ── hApp (from the former AutonymousMe repo) ──
│  Cargo.toml                        ← Rust workspace (4 zomes)
│  happ.yaml / web-happ.yaml         ← hApp manifests
│  conductor-config.yaml             ← local conductor config
│  Makefile / Dockerfile             ← build & container helpers
│  dnas/core/
│    dna.yaml                        ← DNA manifest (manifest_version "0")
│    zomes/
│      identity_wallet/              ← DID lifecycle, credential wallet, audit log (Rust/HDK 0.7.1)
│      openid4vp/                    ← OpenID4VP request/response flow (Rust/HDK 0.7.1)
│      zk_prover/                    ← zk proof storage/audit zome (Rust/HDK 0.7.1)
│      issuer_registry/              ← Phase 4: public DHT issuer profiles (did:hc self-certifying, immutable)
│  circuits/age_check/               ← Circom age≥18 circuit + Groth16 prove/verify scripts
│  api/                              ← REST API (Node/Express), spec section 8
│    scripts/verify-conductor-06.mjs ← 13-check live-conductor e2e (0.6.1)
│    scripts/verify-conductor-07.mjs ← live-conductor e2e (0.7.1)
│  sdk/                              ← Verifier-facing TypeScript SDK
│  ui/                               ← Wallet UI (Vite + @holochain/client 0.21)
│  tests/test/scenario.ts            ← Tryorama 2-agent scenario (mem network)
│  scripts/copy-coordinator-wasms.mjs
│  flake.nix                         ← Holonix dev environment
│  infra/                            ← self-hosted bootstrap kit
│  docs/
│    happ-architecture.md            ← hApp architecture notes
│    holochain-0.7-migration.md      ← 0.4 → 0.7 migration findings
│    architecture/                   ← system diagram exports (v0.4-alpha)
│    superpowers/specs/              ← OpenID4VP/Holochain REST API design spec
│    closure/                        ← decision ledger + open items audit
│    website-readme.md               ← the website's earlier standalone README (reference)
│  Functional_Specifications.docx    ← functional specification
│  Technical_Specifications.docx     ← technical specification
│  README.md                         ← this file
│  LICENSE                           ← Apache 2.0
```

---

## Getting started

### Run the website locally

No install, no build — just open `index.html`, or:

```bash
python -m http.server 8080   # then visit http://localhost:8080
```

### Build the hApp from source

Prerequisites: Rust 1.95+ with `wasm32-unknown-unknown`, Node 22+, Holochain/hc 0.7.1 (see [Holochain releases](https://github.com/holochain/holochain/releases/tag/holochain-0.7.1)), optionally `nix develop` for the Holonix environment.

```bash
npm install                   # installs ui/, api/, sdk/, tests/ workspaces
make build                    # zomes → DNA → hApp → UI
make test                     # Rust tests + api/sdk/tests suites
```

More details in [`docs/happ-architecture.md`](docs/happ-architecture.md) and the Makefile.

---

## Contributing

Issues and PRs welcome. Rust zome changes must keep `cargo clippy --workspace -- -D warnings` and all tests green; JS changes must keep the vitest suites green; CI runs the full matrix plus a live-conductor e2e and a Tryorama 2-agent scenario.

## Community

- GitHub Issues — bug reports and feature requests
- support@autonymous.me — partnerships, eIDAS 2.0 compliance inquiries

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 - Core protocol design | Done | DID method, zk circuit design, SD-JWT schema — see Technical_Specifications.docx |
| 2 - Zomes, circuit, SDK, API | Done, unit/integration tested | identity_wallet, openid4vp, zk_prover zomes (15 tests + clippy clean); age_check circuit (real Groth16 proof verified); verifier SDK (11 tests); REST API (15 tests) — all on Holochain 0.7 (hdk 0.7.1 / hdi 0.8.1) |
| 3 - End-to-end integration | Done for the REST API / Holochain backend + multi-agent | HolochainBackend verified end-to-end against live conductors 0.6.1 and 0.7.1; Tryorama 2-agent scenario on 0.7.1. Wallet UI still needs interactive re-verification |
| 4 - Issuer registry & production trusted setup | **In progress — vertical slice merged** | `issuer_registry` zome live on 0.7.1 (register/resolve/list + duplicate guard, Tryorama-verified); REST `/api/v1/issuers`; SDK + UI client methods. Remaining: browser extension, production-grade Powers of Tau ceremony |
| 5 - Mobile app & governance | Planned | iOS/Android, community governance v1 |
| 6 - eIDAS 2.0 production | Planned | Certification, EUDI Wallet bridge |

---

## License

Copyright 2025-2026 Autonymous.me Community

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the full text.

---

*No rights reserved. Fork freely. Privacy is a right, not a feature.*

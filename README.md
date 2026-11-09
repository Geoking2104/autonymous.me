# Autonymous.me — Self-Sovereign Identity on Holochain

**Your identity, your rules.**

Autonymous.me is an open, community-driven protocol for **self-sovereign identity (SSI)**: you hold your own verifiable identity in a personal wallet, issuers sign credentials for you, and verifiers check only what you choose to share. Built agent-centric on **Holochain**, designed to be **eIDAS 2.0**-ready via **OpenID4VP + SD-JWT**.

- **Live site:** <https://geoking2104.github.io/autonymous.me/>
- **Languages:** English (default) + Français — toggle in the nav, or use `?lang=en` / `?lang=fr`
- **Hosting:** GitHub Pages (this repository, `main` branch)

---

## Repository layout

This repo is intentionally minimal — the entire site is **one self-contained file**:

```
autonymous.me/
└── index.html   ← everything: HTML + CSS + JavaScript + SVG + EN/FR translations
```

No framework, no bundler, no build step, no external CSS/JS dependencies. Everything renders and runs client-side.

---

## Building blocks — the protocol stack

The site's *Architecture* section presents five key building components:

| # | Building block | Role | Standard / Tech |
|---|----------------|------|-----------------|
| 1 | **DIDs + Verifiable Credentials** | Decentralized Identifiers for people & organizations; credentials are cryptographically signed by issuers and stored only by you | [W3C DID 1.0](https://www.w3.org/TR/did-core/) · [W3C VC Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/) |
| 2 | **Holochain** | Agent-centric P2P framework — no global blockchain. Each agent has a local **Source Chain** (append-only personal ledger) mirrored into a peer-validated DHT | [Holochain](https://holochain.org) |
| 3 | **OpenID4VP + SD-JWT** | The bridge to the existing internet: verifiable presentations and **selective disclosure** (prove you're 18+ without revealing your birthdate), compatible with EU eIDAS 2.0 / EUDI wallets | [OpenID4VP v1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html) · [SD-JWT — RFC 9901](https://www.rfc-editor.org/rfc/rfc9901) |
| 4 | **Autonymous.me hApp** | The Holochain application users install — your identity wallet: keys, credentials, sharing controls | Holochain hApp |
| 5 | **Issuer & Verifier ecosystem** | Issuers (universities, banks, governments) sign credentials; verifiers request only the claims they need | OpenID4VP request/response |

### How it flows

```
 Issuer                You (Wallet / hApp)            Verifier
(uni, bank, gov)  →   holds keys + credentials  →   requests only what it needs
 signs credentials     YOU choose what to share      verifies instantly, online
                      ───────────────                ───────────────
                      Source Chain (local, yours)    Zero data retention
```

Three user steps, no technical knowledge required: **1)** create your Digital ID → **2)** choose what to share → **3)** verified, instantly.

---

## Building blocks — the page itself

### Structure (single `index.html`, ~2,000 lines, ~235 KB)

| Anchor | Section | What's in it |
|--------|---------|--------------|
| `#` (top) | **Hero** | Headline, CTAs, animated floating Digital ID card, feature pills |
| `#problem` | **The problem** | "Online identity is broken" — collapsible |
| `#how` | **How it works** | 3-step explainer with tags |
| `#components` | **Architecture** | Key building components, animated Issuer → Wallet → Verifier flow diagram, hApp diagram toggle, Holochain network visualisation |
| `#demo` | **Demo** | Interactive **selective disclosure** demo — toggle age / country / name / DOB / address, see the proof update, or deny |
| `#openid4vp` | **OpenID4VP** | Two panes: *simple* demo and *developer* view — generates a real QR authorization request on a `<canvas>`, simulates the scan, returns an SD-JWT with only the disclosed claims |
| `#sourcechain` | **Your Source Chain** | Live visualisation of a Holochain source chain: watch entries append as you act |
| `#usecases` | **Use cases** | 8 cards: age verification, address proof, professional credentials, KYC/finance, civic participation, healthcare, travel & access, build your own |
| `#community` | **Community** | Open source, non-profit, working groups |
| `#roadmap` | **Roadmap** | 6 phases — see below |
| `#faq` | **FAQ** | Plain-English FAQ — collapsible |
| `#contact` | **Contact** | Contact form (via [FormSubmit](https://formsubmit.co)) |
| — | **GDPR modal** | Data-controller identity, data inventory, GDPR Art. 15–22 rights, privacy-by-design architecture, links to CNIL / EDPB |

### Technical components (all inline, zero dependencies)

- **i18n layer (EN/FR)** — 588 `data-i18n` keys, an `I18N` object with browser-language detection, `localStorage` persistence, `?lang=` URL parameter, `hreflang` alternate links, and EN/FR toggle buttons with `aria-pressed` state.
- **Interactive demos** — selective-disclosure toggles with waiting / approved / denied states; a canvas-based QR authorization-request generator implemented from scratch (no library); a simulated OpenID4VP scan returning an SD-JWT; a source-chain renderer with live appends; animated flow arrows (SVG + JS `animateDot`); Holochain DHT node network rendering.
- **Design system** — CSS custom properties on `:root`: deep-navy background (`#040C18`), amber (`#E8A020`) / teal (`#00C9A7`) / purple (`#7B68EE`) accents; monospace + Arial Black typography; subtle grid overlay; fluid type via `clamp()`; `IntersectionObserver` reveal-on-scroll; collapsible sections; 11 hand-drawn inline SVGs.
- **Contact form** — posts to FormSubmit with client-side validation and a success state; no backend of its own.
- **Privacy layer** — GDPR modal, privacy-by-design messaging, regulator references (CNIL, EDPB, EUR-Lex).

---

## Roadmap

1. **Core Protocol Design** — done
2. **Alpha Wallet (Desktop)** — done
3. **OpenID4VP Integration** — done
4. **Issuer Registry & First Integrations** — vertical slice implemented ([issuer_registry zome](https://github.com/Geoking2104/AutonymousMe), Tryorama-verified on Holochain 0.7.1)
5. **Mobile App & Governance**
6. **eIDAS 2.0 Production & EUDI Bridge**

> **Implementation status:** the working hApp code (4 Holochain zomes, ZK circuit, verifier SDK, REST API) lives in [Geoking2104/AutonymousMe](https://github.com/Geoking2104/AutonymousMe) — all CI checks green on Holochain 0.7.1.

---

## Run locally

No install, no build:

```bash
# Option 1 — just open it
start index.html            # Windows
open index.html             # macOS

# Option 2 — serve it (closer to production behaviour)
python -m http.server 8080
# then visit http://localhost:8080
```

Everything works offline except the contact form (which POSTs to FormSubmit).

## Deploy

Push to `main` — GitHub Pages serves it automatically at
<https://geoking2104.github.io/autonymous.me/>.

---

## Standards & references

- [W3C Decentralized Identifiers (DID) 1.0](https://www.w3.org/TR/did-core/)
- [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/)
- [OpenID for Verifiable Presentations (OpenID4VP) 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [SD-JWT — RFC 9901](https://www.rfc-editor.org/rfc/rfc9901)
- [eIDAS 2.0 — Regulation (EU) 2024/1183](https://eur-lex.europa.eu/eli/reg/2024/1183/oj)
- [GDPR — Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

---

## License

Apache 2.0, as declared on the site. *(Note: a standalone `LICENSE` file hasn't been added to the repo root yet.)*

## Contact

Via the [contact form on the site](https://geoking2104.github.io/autonymous.me/#contact) — every message is read.

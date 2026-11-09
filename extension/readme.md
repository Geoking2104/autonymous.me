# Autonymous.me Wallet — Extension Chrome (Étape 1)

Portefeuille d'identité en lecture seule, connecté au conductor Holochain local. Design « univers Apple » : une action principale, cartes groupées, dark mode automatique.

## État (étape 2 — flux OpenID4VP complet)

- ✅ Popup 360×560 : carte Identité (DID + contexte + copie), Attestations, Source Chain (8 dernières entrées)
- ✅ Connexion au conductor local (`ws://localhost:8888`) via `@holochain/client` 0.21
- ✅ Détection d'état : recherche → connecté / hors ligne, avec bouton Réessayer
- ✅ i18n EN/FR (bouton toggle), dates relatives (`Intl.RelativeTimeFormat`)
- ✅ Dark mode automatique (`prefers-color-scheme`), `prefers-reduced-motion`
- ✅ Service worker MV3 : config conductor persistée (`chrome.storage.local`)
- ✅ Content script : détection des deep links `openid4vp://` (clic intercepté + scan passif, badge discret)
- ✅ Vue Présentation : carte vérifieur, sélecteur de claims à toggles iOS (requis verrouillés), Refuser / Partager
- ✅ Flux complet : parse → build_vp_token (dc+sd-jwt via Lair) → direct_post → record_presentation
- ⏭ Étape 3 : états d'erreur avancés, export chiffré
- ⏭ Étape 4 : soumission Chrome Web Store

## Structure

```
extension/
├── manifest.json          # MV3 : storage, activeTab, content script, localhost
├── src/
│   ├── background/
│   │   └── background.js  # SW : config + requête pendante + badges
│   ├── content/
│   │   └── content.js     # détection openid4vp:// (clic + scan passif)
│   └── popup/
│       ├── popup.html     # structure sémantique
│       ├── popup.css      # design system Apple (SF, cartes, dark auto)
│       ├── popup.js       # logique : rendu, i18n, interactions
│       ├── present-flow.js# logique OpenID4VP (parse/select/build/post/record)
│       └── client.js      # client conductor (identity_wallet + openid4vp)
├── scripts/
│   ├── build.mjs          # bundle esbuild → dist-zip/
│   └── make-icons.mjs     # icônes PNG (sharp) ou SVG (fallback)
└── icons/                 # générés
```

## Lancer en développement

```bash
cd extension
npm install
npm run icons     # génère les icônes (sharp ou fallback SVG)
npm run build     # bundle → extension/dist-zip/
```

Puis dans Chrome : `chrome://extensions` → **Mode développeur** → **Charger l'extension non empaquetée** → sélectionner `extension/dist-zip/`.

Le conductor doit tourner (`make sandbox` à la racine du repo) avec le hApp installé pour voir les données réelles ; sinon le popup affiche l'état « Conductor hors ligne ».

## Choix de conception

- **Lecture seule par défaut, écriture explicite** : la seule écriture est la présentation (journalisée sur la Source Chain) ; création de DID et import se font via le hApp desktop.
- **Option A (clés dans Lair)** : la signature restera dans le conductor ; l'extension ne manipule jamais de clé privée.
- **Style Apple** : `-apple-system`/SF, hiérarchie 11/12/14/17 px, cartes `#FFF`/`#1C1C1E` sur fond `#F2F2F7`/`#000`, accent bleu 007AFF + or E8A020 de la marque, pill buttons, séparateurs 0.5px, safe-area.
- **Permissions** : `storage`, `activeTab`, content script sur http/https (détection des requêtes), `host_permissions` localhost (conductor). Aucune autre host permission.

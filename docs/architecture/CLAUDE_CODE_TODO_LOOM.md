# TODO für Claude Code — LOOM-Aufbau (minimaler Eingriff)

## 0) Ist-Stand (kurz, verifiziert)

- Es gibt **kein** `packages/loom`-Package; die geteilte Engine liegt aktuell in `packages/shared`.  
- Architektur ist im Code noch `@loot/shared`, während die Produktdoku bereits auf **LOOM** umgestellt wurde (`docs/architecture/Monorepo.md`, `docs/product/Portfolio.md`, `docs/product/FLOW_VERGLEICH.md`).  
- FLOW/SPIN importieren Engine-Bausteine aus `@loot/shared` (u. a. `clauseDetector`, `confidenceFilter`, `contextWindowRules`, `rules.gr`).  
- `npm run test:shared` läuft; `npm run test:flow` schlägt aktuell in dieser Umgebung mit `Cannot find module '@loot/shared'` fehl (Workspace-Linking/Install-Problem).

---

## 1) Ziel (nur was zwingend nötig ist)

**LOOM als benannte Engine einführen, ohne große Refactors:**

1. `@loot/loom` als **dünnen Alias** über der bestehenden Shared-Engine anlegen.
2. FLOW/SPIN schrittweise auf `@loot/loom` umstellen.
3. `@loot/shared` vorerst als Legacy-Compat beibehalten (kein File-Move, keine Regel-Logik-Migration in diesem Schritt).

So bleibt Diff klein, risikoarm und token-sparend.

---

## 2) Exakte Datei-TODOs für Claude (Reihenfolge)

### P0 — Minimal lauffähige LOOM-Benennung

#### A) Neues Package anlegen (Alias)

**Neu:** `packages/loom/package.json`

```json
{
  "name": "@loot/loom",
  "version": "0.1.0",
  "description": "LOOM engine alias over shared deterministic linguistic modules",
  "main": "src/index.js",
  "module": "index.mjs",
  "exports": {
    ".": {
      "import": "./index.mjs",
      "require": "./src/index.js"
    }
  },
  "private": true,
  "license": "UNLICENSED",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Neu:** `packages/loom/src/index.js`

```js
'use strict';
module.exports = require('@loot/shared');
```

**Neu:** `packages/loom/index.mjs`

```js
import shared from '@loot/shared';
export const {
  detectClauses,
  splitSentences,
  SUBORDINATING_DE,
  SUBORDINATING_EN,
  COORDINATING_DE,
  COORDINATING_EN,
  filterByConfidence,
  errorProfile,
  koelnerPhonetik,
  phoneticallyEqual,
  findPhoneticMatch,
  contextWindowRules,
  GR_RULES,
} = shared;
export default shared;
```

#### B) Workspace registrieren

**Ändern:** `package.json` (root)

- In `workspaces` **einfügen**: `"packages/loom"` (direkt nach `packages/shared`).

#### C) Konsumenten auf LOOM umstellen (nur direkte Imports)

**FLOW**
- `packages/flow/package.json`: Dependency `@loot/shared` → `@loot/loom`.
- `packages/flow/src/pipeline.js`: `require('@loot/shared')` → `require('@loot/loom')`.
- `packages/flow/src/ruleEngine.js`: dito.
- `packages/flow/test/test_phonetic_similarity.js`: dito.
- `packages/flow/test/test_confidence_filter.js`: dito.

**SPIN**
- `packages/spin/package.json`: Dependency `@loot/shared` → `@loot/loom`.
- `packages/spin/src/index.js`: `from '@loot/shared'` → `from '@loot/loom'`.
- `packages/spin/src/ui.js`: dito.
- `packages/spin/src/diagnosis.js`: dito.

#### D) README nur minimal synchronisieren

**Ändern:** `README.md`
- Titelpassage: „shared linguistic engine“ → „LOOM engine (currently implemented via shared core modules)“.
- Architekturblock: `@loot/shared` → `@loot/loom` als öffentliche Engine-Ebene.
- Abschnitt „Shared Engine (@loot/shared)“ umbenennen in „LOOM Engine (@loot/loom)“ + 1 Satz Legacy-Hinweis, dass Module intern aus `packages/shared` kommen.

> Wichtig: **keine** komplette README-Neuschreibung. Nur die Stellen, die der aktuellen Produktlogik widersprechen.

---

### P1 — nur wenn P0 grün (optional)

1. `packages/shared` in Docs als „internal core“ markieren.
2. Alte `@loot/shared`-Imports in Kommentaren/Texten bereinigen (nicht funktional relevant).
3. Erst danach über echte Modulverschiebung nachdenken (out of scope für diesen Task).

---

## 3) Nicht anfassen (Token- und Risiko-Sparen)

- **Keine** Änderungen an:
  - `packages/smash/**`
  - `database/**`
  - `corpora/**`
  - `old_main/**`
  - Regeldateien (`packages/flow/src/rules.*.js`) in diesem Schritt
- **Kein** Umbau der SN/SL/MO/PG/GR-Pipeline.
- **Kein** API-Redesign, nur Alias/Import-Switch.

---

## 4) Prüfkommandos (kleinster Satz)

```bash
npm install
npm run test:shared
npm run test:flow
npm run test:spin
```

Wenn `npm run test:flow` weiterhin `MODULE_NOT_FOUND` zeigt:

```bash
npm install --workspaces
npm ls @loot/loom @loot/shared
```

---

## 5) Mini-Diffvorschlag (nur Such/Ersetzbar)

- `@loot/shared` → `@loot/loom`
  - `packages/flow/src/pipeline.js`
  - `packages/flow/src/ruleEngine.js`
  - `packages/flow/test/test_phonetic_similarity.js`
  - `packages/flow/test/test_confidence_filter.js`
  - `packages/spin/src/index.js`
  - `packages/spin/src/ui.js`
  - `packages/spin/src/diagnosis.js`

> Danach nur package.json-Dependencies + neues Alias-Package hinzufügen.

---

## 6) Abnahmekriterium für diesen Task

- LOOM ist als Package `@loot/loom` im Monorepo vorhanden.
- FLOW/SPIN nutzen `@loot/loom` statt `@loot/shared` direkt.
- Tests laufen mindestens auf Shared + Flow/Spin-Entry (oder klar dokumentierter Env-Blocker).
- Keine Änderungen außerhalb der oben genannten Pfade.

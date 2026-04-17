# Repo Recanonicalization Audit

Date: 2026-04-17
Scope: structural truth alignment for FLOW/LOOM/SPIN/data/rules/docs.

## Applied hard truths
- `flow-db/` is canonical DB home.
- `database/rules/Erweitertes_Regelwerk.md` is extension/supporting, not competing canonical.
- `packages/spin/` is active real package territory.
- `packages/flow/lab` is engine-related and should migrate under LOOM side.
- FLOW remains broadly usable with explicit LRS/Dyslexia-prioritized focus.

## Area-by-area classification

### 1) `flow-db/`
- Current purpose: canonical database schema/migrations/import/export/tests/gui.
- Placement issue: none (already canonical).
- Target placement: unchanged.
- Classification: **canonical**.
- Confidence: high.
- Automatable action: yes (documentation links only).

### 2) `database/rules/`
- Current purpose: rules docs/reference links.
- Placement issue: canonical-vs-extension relation previously implicit.
- Target placement: keep in `database/rules`, clarify roles.
- Classification: **canonical + split_roles**.
- Confidence: high.
- Automatable action: yes (README/status docs).

### 3) `database/debug/`
- Current purpose: manual debug examples (`Logiktest`, `Testsatz_1_de`).
- Placement issue: mixes debug/manual examples with database operations.
- Target placement: benchmark/examples area (manual fixtures), keep compatibility pointer.
- Classification: **migrate**.
- Confidence: medium-high.
- Automatable action: yes.

### 4) `data/benchmark/`
- Current purpose: benchmark JSONL assets.
- Placement issue: no strong issue; needs clearer relation to `docs/benchmark` and `flow-db`.
- Target placement: keep as benchmark data root.
- Classification: **canonical**.
- Confidence: high.
- Automatable action: yes (README).

### 5) `docs/benchmark/`
- Current purpose: benchmark schema/spec/scoring docs.
- Placement issue: none critical (documentation belongs in docs).
- Target placement: keep under docs as documentation, not datasets.
- Classification: **canonical**.
- Confidence: high.
- Automatable action: low (minor reference updates).

### 6) top-level `docs/`
- Current purpose: mixed architecture/product/research/archive files.
- Placement issue: catch-all sprawl.
- Target placement: split into architecture/product/research/archive/migration.
- Classification: **split**.
- Confidence: medium.
- Automatable action: yes (safe moves + index readmes).

### 7) `docs/Spin/`
- Current purpose: PDF/ZIP research packs and legacy SPIN material.
- Placement issue: active SPIN package truth now lives in `packages/spin`; docs/Spin is mostly research/archive.
- Target placement: `docs/research/spin/` (or archive) with package cross-reference.
- Classification: **migrate + archive**.
- Confidence: high.
- Automatable action: yes.

### 8) `packages/spin/`
- Current purpose: active SPIN package code and README.
- Placement issue: none; needs stronger cross-reference from docs.
- Target placement: unchanged.
- Classification: **canonical**.
- Confidence: high.
- Automatable action: yes (docs linking).

### 9) `packages/flow/lab/`
- Current purpose: lab UI/app-shell/run-store tooling tightly tied to engine diagnostics and benchmark runs.
- Placement issue: engine-related concerns mislocated under FLOW product package.
- Target placement: LOOM-side package path (`packages/loom/lab`).
- Classification: **migrate**.
- Confidence: high.
- Automatable action: yes (move folder + update imports).

### 10) `packages/flow/test/`
- Current purpose: FLOW tests, including lab integration references.
- Placement issue: references point to `../lab` under FLOW.
- Target placement: keep tests in flow package, update imports to LOOM lab path.
- Classification: **merge_ref_update**.
- Confidence: high.
- Automatable action: yes.

### 11) `packages/loom/`
- Current purpose: engine package.
- Placement issue: missing lab subtree despite engine ownership.
- Target placement: absorb lab under `packages/loom/lab`.
- Classification: **merge**.
- Confidence: high.
- Automatable action: yes.

### 12) `corpora/`
- Current purpose: raw corpora and legacy extracted datasets.
- Placement issue: relation to `flow-db` and `database` not explicitly documented.
- Target placement: keep as raw input corpus root.
- Classification: **canonical_input**.
- Confidence: high.
- Automatable action: yes (README clarifying role).

### 13) `database/` (non-rules)
- Current purpose: legacy/transitional assets, tools, datasets, artifacts.
- Placement issue: overlaps semantically with `flow-db`, `data/benchmark`, and corpora layers.
- Target placement: keep as transitional research/support layer; document non-canonical DB status.
- Classification: **split + unresolved naming**.
- Confidence: medium.
- Automatable action: yes (README and boundaries), no destructive move.

## Unresolved (human judgment still needed)
1. Whether to rename `database/` long-term to reduce confusion with canonical `flow-db/`.
2. Whether any `docs/research/spin` PDFs should be product docs vs archive-only.
3. Whether some `database/artifacts/` subsets should be hard-archived or remain active.


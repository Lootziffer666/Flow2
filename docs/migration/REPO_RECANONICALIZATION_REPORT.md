# Repo Recanonicalization Report

Date: 2026-04-17

## Confirmed truths applied
1. `flow-db/` preserved as canonical DB home.
2. `database/rules/Erweitertes_Regelwerk.md` treated as extension/supporting layer.
3. `packages/spin/` treated as active package territory (no recreation).
4. `packages/flow/lab` rehomed under LOOM side.
5. FLOW positioning preserved as broadly usable with LRS/Dyslexia-prioritized focus.

## What was moved

### Engine/lab rehome
- `packages/flow/lab` -> `packages/loom/lab`
- Updated imports:
  - `scripts/phase5_quality_gate.js`
  - `packages/flow/test/test_ui_integration.js`
  - `packages/flow/test/test_lab_integration.js`
  - `packages/flow/test/test_random_lrs_batch.js`

### Docs structure cleanup
- `docs/Spin` -> `docs/research/spin`
- top-level docs rehomed:
  - to `docs/architecture/`: `Monorepo.md`, `Monorepo_Next_Steps_Plan.md`, `EVOLUTION_PROTOCOL.md`, `CLAUDE_CODE_TODO_LOOM.md`
  - to `docs/product/`: `Portfolio.md`, `FLOW_VERGLEICH.md`, `About_Texts.md`
  - to `docs/research/`: `UNUSUAL_APPROACHES.md`
  - to `docs/archive/research_assets/`: `GMEG-master.zip`

### Debug/examples rehome
- `database/debug/*.md` manual examples moved to:
  - `data/benchmark/examples/manual_debug/`
- `database/debug/README.md` added as compatibility pointer.

## What was renamed
- No semantic content renames required.
- Structural recategorization performed via directory moves above.

## What was archived
- Existing old-main archives preserved under:
  - `docs/archive/old_main_concepts/`
  - `docs/archive/old_main_binaries/`
- SPIN legacy packs are now under `docs/research/spin/` and remain non-canonical relative to `packages/spin/`.

## What was merged
- No major content merges were needed in this recanonicalization pass.
- Reference linkage clarity improved with new/readjusted READMEs.

## What was left unresolved
1. Whether parts of `docs/research/spin/` should be moved from research to archive-only.
2. Whether long-term rename/split of `database/` should occur to reduce confusion with canonical `flow-db/`.
3. Whether additional `database/artifacts/` subsets should become strict archive-only.

## Canonicality outcomes
- **Canonical DB runtime:** `flow-db/`
- **Rule docs with explicit relation:** `database/rules/README.md`
- **Benchmark data vs docs split clarified:**
  - data in `data/benchmark/`
  - specification docs in `docs/benchmark/`
- **Raw corpora role clarified:** `corpora/README.md`
- **FLOW vs LOOM structure aligned:** lab tooling now LOOM-side.
- **SPIN active truth not in docs:** package truth remains `packages/spin/`.

## Recommended next human decisions
1. Approve final status of `docs/research/spin/` bundles (active research vs archive-only).
2. Decide whether to formally rebrand/split `database/` support layer to reduce naming ambiguity.
3. Decide if any remaining old-main runtime artifacts should be archived or removed in final pass.


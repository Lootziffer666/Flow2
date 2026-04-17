# DB Layer Migration Plan

Date: 2026-04-17

Scope: staged migration planning only. No broad restructuring performed in this pass.

## 1) Recommended phase order

### Phase 0 — Freeze and inventory (short)
- Freeze DB-layer ownership definitions in docs (loom/flow/spin/smash).
- Generate machine-readable inventory of DB-like assets (schema/rules/lexicons/benchmarks/interventions).
- Mark explicit owners for each inventory row.

### Phase 1 — Safe cleanup of clear duplicates
- Resolve obvious duplicate runtime bundles (`corpora/flow-db/*`) after diff verification.
- Keep historical artifacts, but tag as archive/transitional.

### Phase 2 — Flow boundary hardening
- Keep `flow-db` canonical for FLOW LRS/benchmark/error/corpus runtime.
- Reduce product runtime direct dependence on raw corpus files (move toward DB/API-fed sources).
- Define treatment for local mutable exception stores (`flow_rules.json` contract).

### Phase 3 — Loom canonical extraction design
- Define first `loom-db` schema/resources for cross-product language truth.
- Extract only stable, shared marker/rule resources from LOOM code.
- Introduce consumer contracts for FLOW/SPIN/SMASH (read-only shared layer + product overlays).

### Phase 4 — Spin/Smash bootstrap
- Stand up minimal `spin-db` and `smash-db` as curated resource registries first (not full heavy DB runtime).
- Migrate package-level data-like assets that are stable enough for curation/versioning.

### Phase 5 — Anti-duplication validation gates
- Add CI checks for duplicated canonical resources across layers.
- Add provenance metadata requirements for all new rule/resource additions.

---

## 2) Safe automatic moves (future pass)

These can be automated with low semantic risk once confirmed:

1. **Archive/delete duplicate `corpora/flow-db/*`** after structural diff against `flow-db/*`.
2. **Tag/relocate stale generated reports** in `database/artifacts/reports/*` into a dated archive namespace (without editing history content).
3. **Path/reference hygiene updates** where generated reports or docs still point at superseded paths.

Automation notes:
- Must include pre-move checksum report.
- Must include post-move reference scan.

---

## 3) Moves requiring validation first

1. **Any extraction from `packages/loom/src/*` into future `loom-db`.**
   - Requires linguistic ownership review.
2. **Any movement of `database/rules/*`.**
   - Keep as-is until doc-maintainer approval.
3. **`packages/flow/src/lexiconFallback.js` refactor.**
   - Requires performance + quality regression checks.
4. **Any conversion of package-level SPIN/SMASH assets into `spin-db`/`smash-db`.**
   - Requires schema design and curation workflow agreement.

---

## 4) High-risk duplication zones

1. **Language truth duplication risk**
   - `packages/loom/src/markers.js`
   - `packages/flow/src/rules.*.js`
   - `packages/spin/src/rules.en.gr.js`

2. **Lexicon/error-pair source duplication risk**
   - `flow-db/datasets/*`
   - raw `corpora/*` files
   - runtime loaders in application code

3. **Benchmark semantics duplication risk**
   - `flow-db/src/benchmark_taxonomy.py`
   - `docs/benchmark/*`
   - `scripts/benchmark/*`

Mitigation: introduce one canonical machine-readable source for each semantics domain and generate derivative docs/artifacts from it.

---

## 5) Recommended naming/placement rules

1. **`loom-db`**
   - Only cross-product linguistic truth.
   - No product-specific remediation policy.

2. **`flow-db`**
   - FLOW-specific LRS/dyslexia errors, normalization policy, benchmark curation, and assistive corpus profiling.

3. **`spin-db`**
   - SPIN-specific transformation/expression resources (when stabilized).

4. **`smash-db`**
   - SMASH-specific blockage/intervention eligibility and intervention metadata (when stabilized).

5. **`shared_supporting` paths (`corpora/`, `docs/`, `scripts/`, `tests/`)**
   - May host source data, specs, and tooling.
   - Must clearly state canonical owner layer in file headers/readmes.

6. **Archive/transitional content**
   - Keep under explicit archive/transitional folders with clear non-canonical labels.

---

## 6) Explicit “do not move” items (for next migration pass)

1. **Do not move `database/rules/*` yet.**
   - It is currently the best-maintained rule documentation home.

2. **Do not mass-move `corpora/*` raw corpora into DB-layer folders.**
   - `corpora/` should remain source-input oriented.

3. **Do not force-create heavy `spin-db`/`smash-db` schemas before ownership contracts exist.**
   - Start with scoped registries and explicit contracts.

4. **Do not rewrite benchmark semantics in multiple places in one step.**
   - Stabilize single-source semantics first.

---

## 7) Minimal recommended first migration pass

A practical low-risk first pass should include only:

1. **Duplicate cleanup prep:**
   - Diff `corpora/flow-db/*` vs `flow-db/*` and produce a “unique-lines report”.

2. **Classification metadata hardening:**
   - Add short ownership headers/readmes to top-level clusters (`corpora/`, `data/benchmark/`, `database/rules/`, `flow-db/`).

3. **No semantic rule movement yet:**
   - Keep all rule docs and package rule logic in place.

4. **Open design ticket set for Phase 3/4:**
   - `loom-db` shared-language schema sketch
   - `spin-db` minimal registry sketch
   - `smash-db` minimal registry sketch

Success criteria for first pass:
- no behavior changes,
- no broad file churn,
- reduced duplication ambiguity,
- explicit owner labels for major data/knowledge clusters.

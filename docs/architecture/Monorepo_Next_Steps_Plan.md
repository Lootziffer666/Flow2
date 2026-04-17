# Monorepo Next Steps (effizient, sequenziert)

## Ziel
Mit minimalen, risikoarmen Schritten vom aktuellen Zustand zu einer konsistenten LOOM-first Architektur.

## Ausführungsstatus

- ✅ **Phase 1 umgesetzt (Naming/Imports):**
  - `@loot/loom` als Alias-Package eingeführt
  - Workspaces um `packages/loom` erweitert
  - FLOW/SPIN-Imports und Dependencies auf `@loot/loom` umgestellt
  - `npm run test:shared` und `npm run test:flow` laufen grün
- ✅ **Phase 2 umgesetzt (FLOW strikt begrenzen):**
  - FLOW-Outputs explizit als `scope: normalization` markiert
  - Applied Stages werden transparent als Metadaten ausgegeben
  - neue Scope-Boundary-Regressionstests verhindern stilistische Übernahme
  - Grammatikregel für „auch wenn“ gegen Überkorrektur abgesichert
- ✅ **Phase 3 umgesetzt (SPIN auf LOOM-Signale gehärtet):**
  - Diagnose trennt Signalquellen explizit in `signal_source.loom` und `signal_source.spin`
  - Mehrkernigkeitsdiagnose nutzt LOOM-Clause-Signal statt lokaler Konjunktionslisten
  - UI zeigt Signalherkunft transparent an
- ✅ **Phase 4 umgesetzt (SMASH Signal-Bridge):**
  - minimalen Signalvertrag LOOM → SMASH eingeführt (`state_hint`, `blockage_hint`, `text_ref`)
  - Routing auf `smash-intake` mit append-only Log umgesetzt
  - gezielte Tests für Signal-Normalisierung und Routing ergänzt
- ✅ **Phase 5 umgesetzt (Governance/Quality Gates):**
  - ausführbarer Merge-Gate via `npm run gate:phase5` eingeführt
  - Gate deckt functional, determinism, regression, snapshot und audit append-only ab
  - EVOLUTION_PROTOCOL um operative Merge-Regel ergänzt
- ✅ **Phase 6 umgesetzt (Benchmark-Hardening Datensatz):**
  - deterministisches Benchmark-Suite-Manifest eingeführt
  - Hash-Check für Pattern-Dateien + Bundle-Referenzierung ergänzt
  - kombinierter Gate-Lauf via `npm run gate:phase6` verfügbar
- ✅ **Erweiterter Massentest ergänzt:**
  - LRS-Wortpaar-Evaluation (`bench:lrs-pairs`) gegen `German_Annotation_V028.csv`
  - Report wird nach `database/artifacts/reports/lrs_word_pairs_eval.json` geschrieben
- ⏭️ **Nächster Schritt:** kontinuierliche Erweiterung der Benchmark-Segmente (core/regression/stress/edge)

## Phase 1 — Architektur-Naming stabilisieren (1 PR)

1. `@loot/loom` als Alias über `packages/shared` einführen.
2. FLOW/SPIN-Imports auf `@loot/loom` umstellen.
3. Keine Regelmigration in dieser Phase.

**Erfolgskriterium:** Builds/Tests laufen ohne funktionale Verhaltensänderung.

## Phase 2 — FLOW strikt begrenzen (1 PR)

1. FLOW-Regelpfad markieren: nur Normalisierung (SN/SL/MO/PG + protected spans).
2. Strukturdiagnostische Regeln nur konsumieren, nicht definieren.
3. Regressionstests für „keine stilistische Übernahme“ ergänzen.

**Erfolgskriterium:** Keine Scope-Drift in Richtung Rewrite.

## Phase 3 — SPIN auf LOOM-Signale härten (1 PR)

1. SPIN-Diagnosen explizit in „LOOM Signal“ vs. „SPIN UI-Heuristik“ trennen.
2. UI-Marker nur in SPIN halten.

**Erfolgskriterium:** klare, auditierbare Verantwortungsgrenzen.

## Phase 4 — SMASH Signal-Bridge (1 PR)

1. Minimalen Signalvertrag LOOM → SMASH definieren (z. B. `state_hint`, `blockage_hint`).
2. Nur Routing + Logging, keine neue Interventionslogik.

**Erfolgskriterium:** SMASH kann strukturelle Hinweise konsumieren, bleibt aber eigenständig.

## Phase 5 — Governance/Quality Gates (laufend)

1. `docs/EVOLUTION_PROTOCOL.md` als Merge-Gate operationalisieren.
2. Standard-Checks pro PR: determinism, regression, snapshot, audit append-only.

**Erfolgskriterium:** reproduzierbare, nicht-driftende Entwicklung.

---

## Reihenfolge für maximale Effizienz

1. **Naming/Imports zuerst** (niedriges Risiko, hohe Klärung).
2. **Dann Verantwortungsgrenzen in Code** (FLOW/SPIN).
3. **Dann SMASH-Integration** (erst wenn Signale stabil).

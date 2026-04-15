# Monorepo Next Steps (effizient, sequenziert)

## Ziel
Mit minimalen, risikoarmen Schritten vom aktuellen Zustand zu einer konsistenten LOOM-first Architektur.

## Ausführungsstatus

- ✅ **Phase 1 umgesetzt (Naming/Imports):**
  - `@loot/loom` als Alias-Package eingeführt
  - Workspaces um `packages/loom` erweitert
  - FLOW/SPIN-Imports und Dependencies auf `@loot/loom` umgestellt
  - `npm run test:shared` und `npm run test:flow` laufen grün
- ⏭️ **Nächster Schritt:** Phase 2 (FLOW strikt begrenzen)

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

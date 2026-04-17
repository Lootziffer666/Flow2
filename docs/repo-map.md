# Repo Map — FLOW-SPIN-SMASH

## Purpose

This repository contains the core writing system stack:

- FLOW → normalization (orthography, LRS focus)
- SPIN → structural manipulation (sentence-level)
- SMASH → interruption / unblock layer
- LOOM → canonical shared engine (linguistic foundation)

This is a monorepo. Structure and ownership are strict.

---

## Canonical Packages

### packages/loom
Single source of truth for language logic

Responsibilities:
- grammar rules
- phonetic logic
- structural constraints
- shared linguistic abstractions

Rules:
- no duplication of linguistic logic outside loom
- downstream packages must treat loom as canonical

### packages/flow
Normalization engine

Uses loom for:
- correctness models
- orthographic rules
- shared linguistic truth

Responsibilities:
- error detection
- normalization pipelines
- LRS-focused transformations

### packages/spin
Structural writing tool

Uses loom for:
- grammar validation
- structural constraints
- phonetic insights

Responsibilities:
- sentence decomposition
- word-object rendering
- structure manipulation

### packages/smash
Intervention layer

Purpose:
- break writing blocks
- trigger state changes
- remain lightweight in linguistic ownership

---

## Dependency Rules

Allowed:
- flow → loom
- spin → loom
- smash → loom (optional)
- smash → flow/spin (read-only usage)

Forbidden:
- loom → anything
- flow ↔ spin direct coupling
- any package → deprecated shared layer

---

## Legacy / Migration

### old_main
Status: pending deletion

Rules:
- no new changes
- verify emptiness before removal

### shared
Status: deprecated, replaced by packages/loom

Rules:
- must not be used
- must not be reintroduced

---

## Structural Rules

- All core logic lives in /packages
- Scripts orchestrate only
- Root must not become a hidden logic layer

---

## Testing & Validation

Fast validation:
./scripts/verify-fast.ps1

Full validation:
./scripts/verify-full.ps1

Targeted package test:
./scripts/test-package.ps1 flow

Loom impact check:
./scripts/loom-impact-check.ps1

---

## Change Protocol

When modifying loom:
- inspect possible impact on flow and spin
- check for duplicated rule ownership
- prefer extending loom over local hacks

When modifying flow:
- ensure normalization remains aligned with loom

When modifying spin:
- ensure structure rules remain aligned with loom

When modifying smash:
- avoid reimplementing flow/spin responsibilities

---

## Mental Model

LOOM defines truth  
FLOW applies truth  
SPIN reshapes truth  
SMASH breaks blockage around truth

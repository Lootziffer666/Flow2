# LOOM Lab

Engine-side lab tooling (run store, suite runs, promote wizard, console rendering).

This directory was rehomed from `packages/flow/lab` to align with engine ownership:
- LOOM = engine diagnostics/signals/orchestration territory
- FLOW = product/app layer

FLOW tests and scripts may import these modules, but canonical ownership is LOOM-side.

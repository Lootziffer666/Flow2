# loom-db

Canonical Loom-owned language knowledge layer.

Current scope in this migration block:
- shared linguistic marker sets extracted from package-embedded runtime code
- shared DE/EN clause connector knowledge (subordinating/coordinating sets)
- no heavy schema/runtime DB introduced yet

Design intent:
- `loom-db` owns cross-product language/text-processing truth
- product layers (`flow-db`, future `spin-db`, future `smash-db`) consume Loom truth rather than duplicating it

Status:
- early/seeded layer (resource extraction phase)
- additional canonical Loom resources to be migrated in later controlled blocks

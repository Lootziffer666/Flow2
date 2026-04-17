# Product Requirements Document (PRD)

## Product Name

**SMASH**

## System Context

**LOOM / FLOW / SPIN / SMASH Writing System**

---

## 1. Product Definition

SMASH is a real-time intervention layer inside a lightweight standalone HTML writing environment.

It is designed to break writing block states through ultra-short, embodied, absurd, low-latency interactions embedded directly into the writing space.

SMASH does **not** help the user think through a block.
It helps the user **exit the blocked state fast enough to resume writing**.

---

## 2. Product Role in the System

SMASH is one application layer on top of **LOOM**.

### LOOM

LOOM owns:

* text-state processing
* trigger and activation logic
* relevant grammar / structure / phonetic / text-processing knowledge
* recognition of writing-related state patterns

### FLOW

FLOW uses LOOM to reduce friction at the orthographic and normalization level.

### SPIN

SPIN uses LOOM to make structure visible and formable through language and sentence transformation.

### SMASH

SMASH uses LOOM’s text-processing expertise to intervene when writing has stalled, locked, looped, or become psychologically over-authoritative.

**Detection belongs to LOOM. SMASH begins at intervention.**

---

## 3. Product Overview

SMASH transforms writer’s block from a psychological barrier into a short, physical interaction problem.

Instead of requiring reflection, insight, explanation, or deliberate help-seeking, SMASH introduces immediate micro-interventions that:

* break the felt authority of stuck elements
* interrupt loops
* collapse over-seriousness
* produce a short disarming rupture
* return the user to writing with less resistance

SMASH is the opposite pole of SPIN:

* **SPIN** works through meaning
* **SMASH** works through impact

---

## 4. Core Goal

> Turn writer’s block into a solvable real-time interaction problem without requiring the user to consciously enter a help-seeking mindset.

---

## 5. Why the Product Exists

Many writing tools assume that blockage is mainly a thinking problem.

SMASH is built on a different thesis:

> Writer’s block is not primarily a knowledge problem.
> It is a **state problem**.

When a user is stuck, more explanation, more language, more choices, more reflection, or more “support” can worsen the block.

SMASH solves this by:

* bypassing cognition
* switching from meaning to action
* interrupting the blocked state physically and perceptually
* returning the user to writing before the loop rebuilds

---

## 6. Target Users

### Primary Audience

Anyone who writes and experiences writing friction, stalls, fixation, or block states.

### Priority Segments

SMASH is especially relevant for users with:

* perfectionism tendencies
* looping / fixation tendencies
* momentum-sensitive writing behavior
* sensitivity to cognitive overload
* language insecurity
* LRS-/Dyslexia-related writing friction through system integration with FLOW

### Positioning

SMASH is broadly usable, but it is designed around **high-friction writing states**, not around average low-friction writing.

---

## 7. Problem Statement

Writers experience blockages that:

* stop momentum
* trap them in local loops
* create pressure and over-attachment to a word, sentence, or passage
* increase self-monitoring
* make continuation feel harder than it should

Existing tools often fail because they:

* add cognitive load
* require explicit recognition of the problem
* require reading, deciding, or interpreting
* respond too slowly
* stay inside the same mental mode that caused the block

---

## 8. Solution Concept

SMASH introduces immediate embodied micro-interventions that:

* require no typing
* require no explanation
* begin immediately
* end quickly
* operate through spatial, motor, absurd, and perceptual disruption
* reduce the felt seriousness of the blocked element
* create enough state change to resume writing

SMASH is already meaningful as a manually accessible interruption layer.
Automatic detection is a later enhancement owned by LOOM, not a prerequisite for product value.

---

## 9. Product Principles

### 9.1 No Cognitive Overhead

SMASH should not require:

* reading
* interpretation
* planning
* verbal self-analysis

### 9.2 Immediate Entry

Interaction begins instantly.
No setup, loading ritual, explanation screen, or tutorial wall.

### 9.3 Physical Over Verbal

Motor interaction is preferred over linguistic processing.

Primary interaction forms:

* taps
* swipes
* drags
* holds
* collisions
* simple spatial gestures

### 9.4 Absurdity Over Traditional Helpfulness

SMASH should aim for a short, disarming WTF effect rather than conventional usefulness.

It is not a coach.
It is not a lesson.
It is not reflection support.

### 9.5 Ultra-Short Loop

Interventions must be brief.

* hard maximum: **60 seconds**
* preferred duration: **5–20 seconds**

### 9.6 No Performance Pressure

No scoring.
No failure.
No “correct way.”
No optimization anxiety.

### 9.7 Near-Zero Friction

SMASH lives inside a lightweight standalone HTML writing environment specifically to ensure extremely low latency and broad hardware tolerance.

The intervention must feel instant even on very weak devices.

---

## 10. Experience Model

### 10.1 Entry Condition

SMASH may be:

* entered manually
* triggered by LOOM-owned activation logic in later versions

Trigger detection itself is out of scope for this PRD.

### 10.2 Spatial Entry: The White Door

SMASH appears through a rupture in unused white space.

A white door appears within the canvas and acts as the entry point into the intervention space.

The door is:

* not navigation
* not a menu
* not an option panel

It is a break in the writing surface.

### 10.3 The SMASH Zone

A temporary isolated space where:

* normal writing expectations do not apply
* text may lose semantic authority
* elements behave like objects rather than meaning-bearing units
* the user performs a short physical sequence

### 10.4 Exit

Exit is:

* automatic after completion or timeout
* immediate
* explanation-free
* seamless back into the writing context

There is no summary, no “lesson,” no recap.

---

## 11. Core Interaction Model

All interactions must:

* start within **<300ms**
* be understandable within **0–2 seconds**
* finish within **≤60 seconds**
* require no verbal instruction to operate

### 11.1 Pattern Breakers

Purpose:

* interrupt cognitive or perceptual loops

Examples:

* flipping
* inversion
* distortion
* fragmentation
* temporary deconstruction and reassembly

### 11.2 Motor Actions

Purpose:

* shift the user from overthinking to action

Examples:

* rapid tapping
* swipe sequences
* drag-and-release
* hold-and-break
* physical collision actions

### 11.3 Object Interaction

Purpose:

* de-sacralize the blocked element

A word, fragment, or shape may appear as a temporary object, but:

* it is treated as an object, not as a linguistic task
* the user must not be required to analyze it
* no semantic solution is expected
* no new writing duty is introduced inside SMASH

### 11.4 Binary / Instinctive Choice

Purpose:

* force low-cognition commitment

Examples:

* left/right
* up/down
* tap/hold
* split/merge
* icon-based choices without text labels

### 11.5 Constraint Injection

Purpose:

* reduce mental load indirectly

Examples:

* narrowing focus
* temporarily suppressing previous context
* removing access to the blocked locus for a moment
* enforcing one-directional movement

---

## 12. Relationship to the Rest of the System

### FLOW

* handles orthographic / normalization friction
* especially helpful for users with LRS-/Dyslexia-related writing burden
* uses LOOM for linguistic truth

### SPIN

* makes structure visible and manipulable
* works through language, form, and transformation
* uses LOOM for grammar, structure, and phonetic/linguistic support

### SMASH

* breaks block states
* interrupts psychological over-attachment
* works through intervention, not interpretation
* uses LOOM for activation context and text-state expertise

### Layer Dynamic

| Layer | Function   | Mode                              |
| ----- | ---------- | --------------------------------- |
| LOOM  | Understand | Engine / processing / detection   |
| FLOW  | Stabilize  | Passive, continuous, assistive    |
| SPIN  | Reshape    | Reflective, structural, cognitive |
| SMASH | Break      | Immediate, physical, interruptive |

---

## 13. Emotional Outcome

After SMASH, the user should feel:

* “That was weird”
* lighter
* less attached to the blocked element
* less serious about the local blockage
* able to continue

The user should **not** feel:

* educated
* corrected
* judged
* tested
* “improved” in a formal sense

---

## 14. Success Criteria

### Primary Product Metrics

* time to resume writing after SMASH
* percentage of interventions followed by new output within a defined time window
* reduction in repeated immediate stalls
* session continuation rate after intervention
* reduced local fixation recurrence

### Qualitative Signals

* “That snapped me out of it.”
* “I stopped caring about that stuck word.”
* “I just continued.”
* “It interrupted the pressure.”

### Failure Signals

* user has to think too much
* intervention feels like a task
* interaction feels like a mini-game detour
* user returns with the same level of stuckness
* intervention adds friction instead of removing it

---

## 15. Configuration Scope

User-facing controls may include:

* intervention frequency
* intensity level
* manual availability
* whether automatic activation is allowed once LOOM-side triggering exists

These settings are secondary to the core interaction and must not overload the user.

---

## 16. Non-Goals

SMASH must **not**:

* teach writing
* explain writing problems
* diagnose blockages
* require reading or typing
* become a mini-game platform
* reward performance with points or ranks
* become narrative-heavy
* replace SPIN
* own trigger-detection logic
* duplicate LOOM’s text-state expertise

---

## 17. Out of Scope

The following are explicitly out of scope for this PRD:

* trigger detection logic
* state inference models
* cross-layer activation policy
* adaptive personalization logic
* long-term behavioral modeling
* deeper automation strategy between LOOM, FLOW, SPIN, and SMASH

These belong primarily to **LOOM** or later integration work.

---

## 18. Technical Product Constraint

SMASH is intended to run inside a lightweight standalone HTML writing environment because:

* intervention latency must be near zero
* the user must never feel “loaded into a tool”
* the interaction should run smoothly on very weak hardware
* tiny footprint supports frictionless entry and broad portability

This is not an incidental implementation detail.
It is part of the product strategy.

---

## 19. Product Thesis

> SMASH is a real-time embodied interruption layer that breaks the psychological spell of writing blocks through ultra-fast, absurd, physical interactions embedded directly into the writing space.

---

## 20. One-Line Definition

> SMASH is the intervention layer of the writing system: LOOM detects, FLOW stabilizes, SPIN reshapes, and SMASH breaks block states fast enough for writing to continue.

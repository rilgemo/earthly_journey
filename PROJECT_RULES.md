# Earthly Journey — Project Rules v0.1

Status: Draft
Scope: All contributors (human or AI), all repository changes.
Not yet frozen — subject to revision after real usage.

## Scope

This document governs how the repository evolves.
It does not define Earthly simulation rules.
Simulation rules belong to the canonical specifications
(SIMULATION_SPEC.md, GDD.md, MILESTONES.md).

---

## 1. Repository Truth

Principle:
Documentation, specs, closure reports, and any AI-generated analysis
must describe the repository as it currently exists — not an intended,
aspirational, or historically-assumed layout.

Examples observed in this repository:
- Assuming `test_cp4.js` exists because `test_cp3.js` and `test_cp5.js`
  do (it never existed — numbering is append-only, not continuous)
- Assuming a `tests/kernel/` directory when the actual files live in
  `src/earthly-kernel/`
- Referencing a document version (e.g. sync doc "v3.7") without
  verifying it against the actual current file

Repository Truth applies equally to relationships between entities.
Do not describe a relationship that cannot be supported by
repository evidence. Historical influence, runtime dependency,
ownership, reference, and future proposals are distinct concepts
and must not be conflated — do not infer one from the mere
coexistence of two things.

## 2. Single Owner Principle

Every repository-level fact has exactly one owning document. Other
documents may reference that fact, but must not redefine or duplicate it.

Ownership defines where a fact is maintained, not where it may be
referenced.

Example: TODO.md owns "current project phase." Other documents may
point to it, but must not restate or maintain their own copy of it.

## 3. Freeze Authority

Exploration → Review → Freeze.

AI collaborators may explore (generate proposals, alternatives,
structural analysis) or review (pressure-test, verify against
evidence). Neither may declare a decision frozen.

Yongkit holds freeze authority.

Current assignment of exploration/review roles among specific AI
tools is documented in earthly-journey-sync.md, not here — this
rule states the pattern, not the current occupants.

## 4. Evidence Before Conclusion

A claim about current system behavior ("this passes," "this is
implemented," "this is confirmed") must be backed by observable
repository evidence — a test run, a benchmark, a replay, a git diff,
a schema check — not a prior conversational summary or memory of an
earlier session.

## 5. Repository Verification Before Claims

Before referencing any file's content, path, or state, verify it
against the actual repository directly, not against a cached copy,
a Project attachment, or a remembered version. If repository access
is unavailable, say so explicitly rather than assuming.

## 6. Branch → Review → Merge

Repository changes go through a feature branch and human review
before merging into `main`. Never a direct push to `main`, regardless
of how confident the content is or who/what proposed it.

## 7. Canonical vs Historical

- Canonical state (current rules, current schema) lives in one place
  per fact and contains no history or reasoning.
- Historical reasoning (why a decision was made, what alternatives
  were rejected) lives separately (e.g. LAYER 4 of the sync doc) and
  never overrides canonical state.
- Commit history is an operational event log, not a reasoning archive
  — do not assume commit messages explain "why," only "what changed."

---

## Out of scope for v0.1 (deliberately excluded)

- AI-specific personas or tool-specific workflows (Claude/ChatGPT/
  Cursor/VS Code usage) — these stay in tool-specific files (e.g.
  CLAUDE.md) if needed at all.
- Any new naming/taxonomy proposal not yet validated through real use.

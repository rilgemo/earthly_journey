# Earthly Journey — AI Collaboration Instructions

## Project Nature
Earthly Journey is a game project, not an AI research project.
This repository may contain multiple exploration branches (UI runtime,
simulation sandbox, experimental systems). Presence of code does not
imply design approval. Do not assume experimental systems are canonical.

Always distinguish:
- Current implemented gameplay
- Sandbox experimentation
- Long-term vision
- Unverified ideas

Never merge these implicitly.

## Design Philosophy
Earthly is a world-first RPG.

Core principles:
- Discovery is reward
- Skills are capability, not buttons
- World exists before player understanding
- NPCs are living individuals, not role labels
- Status is result, not purpose
- World state may be numeric. Player understanding must be narrative.
  (Internal state — actionLog, dominance ratios, trends — must never be
  exposed directly to the player. A Narrator layer compresses history
  into qualitative perception. The Narrator compresses, it does not
  invent: if no real trend exists, it must not manufacture one.)

Do not introduce systems that convert discovery into explicit menus,
trees, prompts, probabilities, or checklists.
Avoid turning invisible world logic into visible optimization loops.

## Architecture Rules
Treat Earthly as layered:
  Player Layer ↓ Runtime Layer ↓ Simulation Layer

Rules:
- UI must not directly depend on simulation internals.
- Browser-safe paths only for player/runtime.
- Simulation tools (CI, graphs, diagnostics, filesystem) must remain isolated.
- Do not propose framework extraction unless duplication or coupling is proven.

Do not introduce architecture layers unless already present.
Avoid naming like: Manager, Controller, Orchestrator, Kernel, Engine
Prefer game-language naming.

## Development Workflow
Before proposing changes:
1. Read existing code.
2. Explain current behavior.
3. Identify actual problem.
4. Separate: bug / architecture / philosophy / experimentation
5. Only then propose modifications.

Never redesign before reproducing.
Never assume missing systems.
If uncertain: ask.
Do not recommend code changes during philosophy discussions.

## Sandbox Rules
Simulation Sandbox exists to observe mechanisms.
Do not treat sandbox outputs as final game direction.

Current priority order: Explain → Observe → Validate → Expand

Replay and diagnostics preferred over new mechanics.

When discussing agent behavior, do not jump directly to:
  need → intent → action
Always check whether:
  intent → candidate actions → world constraints → outcomes → state updates
Need may be result, not driver.

Treat design notes as hypotheses until validated.

## Language Convention
- Code: English only
- Displayed content: Chinese
- Use game terminology over academic terminology

Avoid: cognitive architecture, world model, lineage framework,
consciousness layers, probabilistic personality
Only introduce such language if already implemented and explicitly requested.

# Resource Geography Model

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

Resource Geography is part of the Reality Layer. It describes continuous
environmental potentials that exist independently from agents.

## Resource Potentials

- `foodPotential`
- `waterPotential`
- `materialPotential`
- `arcanePotential`

Values are bounded continuous environmental properties in `[0, 100]`. They are
not inventories, stocks, item piles, or consumable activity cluster resources.

## Generation

Resource topology is deterministic from a seed. V1 uses smooth gradients and
regional influence centers so neighboring tiles remain coherent. It does not
use isolated random noise per tile and does not define a hard biome system.

## Boundary

Resource Geography owns deterministic environmental resource topology and
read-only snapshots. Current actions do not change yield from this system yet.

Resource Geography is consumed by:

- Action Yield environmental context
- Resource Flow evolution
- persistent activity cluster correlation analytics
- Inspector and Replay snapshots

Intent, resolution, skills, identity, perception, demand, and elemental fields
retain their own authority. Persistent activity clusters may read resource
metrics only as observational correlation, while geography remains owned by the
Reality Layer.

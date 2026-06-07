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
not inventories, stocks, item piles, or consumable settlement resources.

## Generation

Resource topology is deterministic from a seed. V1 uses smooth gradients and
regional influence centers so neighboring tiles remain coherent. It does not
use isolated random noise per tile and does not define a hard biome system.

## Boundary

Resource Geography may provide environmental context and read-only snapshots.
Current actions do not change yield from this system yet.

Resource Geography must not:

- Assign actions
- Create settlements
- Modify Intent Generation or Resolution Model
- Modify skills, identity, perception, demand, or elemental fields

Settlements may read resource metrics only as observational correlation. They
must never alter geography.

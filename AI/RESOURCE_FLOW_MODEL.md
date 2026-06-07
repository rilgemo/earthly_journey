# Resource Flow Model

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

Resource Flow v1 evolves Resource Geography over time. It is a Reality-layer
environmental process consumed by Trace, Replay, and environmental analysis.

## Tick Flow

```text
previous Resource Geography
  -> depletion from completed Action Yield snapshots
  -> regeneration toward baseline
  -> spatial diffusion
  -> bounded updated Resource Geography
  -> Trace and Replay snapshot
```

## Depletion Boundary

Depletion is driven only by completed Action Yield results. Agent count,
activity cluster density, demand values, identity, skills, and perception do not
directly deplete resources.

## Regeneration and Diffusion

Regeneration is slow movement toward a baseline map and may be biased by local
elemental fields. Diffusion transfers resource potential from high neighboring
tiles to low neighboring tiles with bounded per-tick transfer.

## Ownership and Consumption

Resource Flow owns:

- depletion from completed Action Yield snapshots
- regeneration toward environmental baselines
- spatial diffusion between neighboring tiles
- bounded updated Resource Geography snapshots

Intent, resolution, skill, identity, perception, demand, and activity cluster
systems consume snapshots or derived metrics through their existing read paths.

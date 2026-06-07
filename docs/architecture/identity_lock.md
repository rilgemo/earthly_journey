# Identity Lock Architecture

Identity Anti-Influence Lock v1 prevents derived labels from becoming behavior
authority.

## Tick Boundary

```text
Between ticks:
  frozen identity snapshot is readable

Tick begins:
  previous identity snapshot is removed

Decision and execution:
  identity-free runtime view only

Tick post-process:
  derive labels from resulting skills
  install frozen identity snapshot
  append identityChanges to trace
```

## Modules

- `identityGuard.js` deeply rejects identity fields in decision inputs.
- `identityLock.js` controls tick-boundary removal and post-tick frozen
  snapshots.
- `identityDerivation.js` converts read-only skill state into descriptive
  labels.

The compatibility module at `src/simulation/skills/identityDerivation.js`
re-exports the canonical derivation module. It does not contain decision logic.

## Anti-Influence Rules

- Intent Generator and Resolution Model call the leak guard.
- Decision views contain only required runtime capability and context fields.
- Skill growth and knowledge learning never import identity modules.
- Identity derivation runs after world, emergence, and stability phases.
- Identity snapshots are frozen and have no runtime setter.

This preserves behavior-driven emergence:

```text
behavior -> skill -> descriptive identity
```

The reverse direction is forbidden.

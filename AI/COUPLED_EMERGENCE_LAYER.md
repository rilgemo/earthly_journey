# Earthly Coupled Emergence Layer v1

`COUPLED_EMERGENCE_LAYER v1` connects existing agent, social, and elemental field systems through additive feedback propagation.

It does not introduce a new simulation domain. It does not select actions, execute actions, or mutate elemental fields.

## Feedback Loop

```text
World Field
  -> Agent Perception and Influence
  -> Resolved Agent Activity
  -> Elemental Field Dynamics Commit
  -> Coupled Emergence Proposals
  -> Next Tick Elemental Field Dynamics
```

Coupled emergence runs last in the world tick phase. Its proposals are queued for the next elemental field tick so the layer cannot bypass the physics engine or `tickManager()` authority.

## Couplers

- Activity coupling translates aggregated activity into field perturbation proposals.
- Social coupling translates local density, conflict density, and stable settlement presence into field perturbation proposals.
- Memory imprint tracks repeated local activity and emits persistent physical bias proposals.

Memory imprint history belongs to the coupling layer. It does not directly modify tile field values or tile baselines.

## Output Contract

Each proposal has:

```js
{
  tileId,
  fields: {
    fire,
    water,
    air,
    earth,
    life,
    arcane
  },
  source: 'activity' | 'social' | 'memory'
}
```

All field values are additive pressure proposals. Only Elemental Field Dynamics may process them, and only `tickManager()` may commit resulting world state.

## Forbidden Behavior

Coupled Emergence may not:

- Directly modify field state or field baselines
- Select or execute actions
- Introduce new field types
- Create scripted game events
- Bypass Elemental Field Dynamics
- Bypass `tickManager()`

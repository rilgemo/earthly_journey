# Earthly Influence Field v1

`INFLUENCE_FIELD v1` is an additive behavioral pressure layer.

It aggregates environmental, memory, social, and need pressure into a normalized influence profile.

It is not a decision layer and it is not an execution layer.

## Authority Chain

```text
Memory
+
Needs
+
Influence Field
  -> Intent Generator
  -> RESOLUTION_MODEL
  -> EXECUTION_MODEL
  -> tickManager()
```

## Influence Profile

An influence profile is a map of behavioral pressure channels:

```ts
type InfluenceProfile = {
  [influenceKey: string]: number;
};
```

Example:

```js
{
  forage: 15,
  rest: 8,
  forge: 22,
  cast_magic: 10
}
```

Influence keys are not actions. Action influence mappings live in influence profiles.

## Sources v1

- World fields: fire, water, arcane
- Observed personal memories
- Heard social memories
- Evaluated needs

Heard memories must contribute less pressure than equally strong observed memories.

Legacy profession and derived identity are not Influence Field sources.

## Boundary Rules

Influence Field may:

- Modify candidate intent weights additively
- Contribute influence scores
- Aggregate pressure sources
- Produce trace and Inspector data

Influence Field may not:

- Select actions
- Execute actions
- Mutate world state
- Bypass `RESOLUTION_MODEL`
- Bypass `tickManager()`

Only `RESOLUTION_MODEL` may select the final intent.

Only `tickManager()` may commit world mutations.

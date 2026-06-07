# Earthly Architecture Language Guide

Earthly models agent-level emergence. Documentation should describe systems in
agent-centric terms that work for humanoids, animals, monsters, and future
non-human agents.

## Preferred Terminology

Use these terms in architecture narratives, docs, comments, test descriptions,
and Inspector labels when compatibility does not require an existing API name.

| Legacy phrase | Preferred phrase |
| --- | --- |
| Settlement | Persistent Activity Cluster |
| Village / Town | Human Settlement Expression |
| Pack Territory | Animal Settlement Expression |
| Nest | Species Settlement Expression |
| Proto-Economy | Resource Exchange Emergence |
| Economy | Exchange Structure |
| Trade | Repeated Exchange Pattern |
| Culture | Collective Memory Expression |
| Tradition | Stable Collective Memory |
| Human Society | Agent Collective Structure |
| Community | Social Cluster |
| Profession | Derived Identity Expression |
| Role | Behavioral Expression |

Runtime identifiers may keep legacy names for compatibility. Prefer the
agent-centric term in explanatory prose.

## Authority Language

Describe systems by ownership and data flow.

Prefer:

- owns authority for
- observes
- derives from
- emerges from
- is consumed by
- is produced by

Avoid defensive phrasing such as:

- avoid becoming
- prevent becoming
- must not become
- do not turn into

## System Description Pattern

Each system document should make these relationships clear:

- Ownership: what the system owns
- Observation: what the system observes
- Derivation: what the system derives from
- Consumption: what consumes its output

Example:

```text
Resource Exchange Emergence owns exchange observation.
Exchange snapshots are produced from completed action traces.
Exchange snapshots are consumed by Replay, Inspector, and higher-order
collective systems.
```

## Agent-Centric Modeling

Higher-order structures should emerge from:

- repeated actions
- world demand pressure
- skill progression
- environmental constraints
- social memory and trust
- perception divergence

They should not be described as human-only systems unless the text is
specifically discussing a Human Settlement Expression.

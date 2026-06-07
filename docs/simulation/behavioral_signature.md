# Behavioral Signature System

Behavioral Signature v1 is an observability-only action-history analytics
system.

## Components

- `behaviorTraceRecorder.js`: records completed actions in immutable sliding
  window snapshots
- `behaviorPatternExtractor.js`: computes sequences, transitions, loops,
  exploration, and stable cycles
- `behaviorMetrics.js`: computes entropy, routine stability, behavioral drift,
  cycle strength, and variation
- `behavioralSignature.js`: combines patterns and metrics into per-agent
  signatures

## Integration

TraceCollector records each completed agent trace and forwards only:

```js
{
  agentId,
  tick,
  action,
  contextTags
}
```

No complete agent object enters the analytics system. TraceCollector exposes
read-only behavior histories and signatures. Replay traces can be loaded for
offline deterministic analysis.

## Inspector

The read-only Behavior Panel displays:

- Dominant actions and action-frequency heatmap values
- Action transitions
- Detected loops
- Exploration index
- Stability score

## Authority Boundary

Behavioral Signature describes what happened. It cannot affect what happens
next. Runtime decision, skill, identity, perception, and field modules do not
import or read behavior analytics.

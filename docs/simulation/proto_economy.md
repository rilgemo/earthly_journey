# Resource Exchange Emergence Layer v1

Resource Exchange Emergence detects local exchange-like interactions from
completed traces. It is a read-only analytics layer.

## Modules

- `exchangeDetection.js`: detects candidate exchange events from completed
  trace data.
- `exchangeContextModel.js`: computes contextual factors such as trust,
  proximity, resource asymmetry, perceived need alignment, and behavioral
  history.
- `trustExchangeGraph.js`: derives trust-weighted interaction edges.
- `reciprocityDynamics.js`: tracks relational continuity across ticks.
- `interactionBalance.js`: keeps typed resource vectors without currency or
  normalized value conversion.
- `exchangeTraceBuilder.js`: emits replay-safe `exchangeSnapshot` data.

## Integration

`TraceCollector.endTick()` creates the exchange snapshot after actions and
action yields have been recorded. Replay receives the snapshot as part of the
immutable tick trace.

## Ownership and Consumption

The layer owns exchange observation, trust-weighted interaction clusters,
reciprocity chains, and typed resource-flow snapshots. Intent generation,
resolution, and world state mutation are owned by their existing runtime
layers.

Inspector support lives in `ProtoEconomyPanel.jsx` and displays event
timelines, reciprocity chains, trust edges, and typed resource flow.

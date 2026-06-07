import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

function collectIntentTraces(trace = [], world = {}) {
  const fromTrace = trace.flatMap(tick => (
    (tick.agents || []).map(agent => ({
      agentId: agent.agentId,
      intentTrace: agent.intentTrace
    })).filter(entry => entry.intentTrace)
  ));
  const fromWorld = (world?.agents || [])
    .map(agent => ({
      agentId: agent.id,
      intentTrace: agent.runtime?.lastIntentTrace
    }))
    .filter(entry => entry.intentTrace);

  return [...fromTrace, ...fromWorld];
}

export default function IntentDebugPanel({ trace = [], world = {} }) {
  const rows = collectIntentTraces(trace, world);
  if (!rows.length) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Intent Debug</h3>
      <div style={{ maxHeight: 360, overflow: 'auto' }}>
        {rows.slice(-40).reverse().map(({ agentId, intentTrace }, index) => (
          <div key={`${agentId}-${index}`} style={{ marginBottom: 10 }}>
            <strong>{agentId}</strong>
            <div>Seed: {intentTrace.phaseA?.deterministicSeedHash}</div>
            <div>Selected: {intentTrace.phaseC?.selectedIntent || 'none'}</div>
            <div>
              Raw: {(intentTrace.phaseA?.rawScores || [])
                .map(score => `${score.intent}:${format(score.score)}`)
                .join(', ') || 'none'}
            </div>
            <div>
              Modifiers: {(intentTrace.phaseA?.rawScores || [])
                .map(score => `${score.intent} typology:${format(score.components?.typologyModifier)} demand:${format(score.components?.demandScore)} field:${format(score.components?.fieldScore)}`)
                .join(' | ') || 'none'}
            </div>
            <div>
              Enriched: {(intentTrace.phaseB?.enrichedContext || [])
                .map(entry => `${entry.intent}[${(entry.labels || []).join(',')}]`)
                .join(', ') || 'none'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

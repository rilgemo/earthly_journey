import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

export default function PerceptionDriftPanel({ world }) {
  const metrics = world?.perceptionDrift?.metrics;
  if (!metrics) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Perception Drift</h3>
      <div>Global entropy: {format(metrics.globalBeliefEntropy)}</div>
      <div>Rumor strength: {format(metrics.rumorClusterStrength)}</div>
      <div>Convergence: {format(metrics.convergenceScore)}</div>
      <div>Persistence: {format(metrics.misinformationPersistenceRate)}</div>

      <div style={{ marginTop: 8 }}>
        <strong>Agent drift</strong>
        {Object.entries(metrics.perceptionDriftIndex || {}).map(([agentId, drift]) => (
          <div key={agentId}>{agentId}: {format(drift)}</div>
        ))}
      </div>
    </div>
  );
}

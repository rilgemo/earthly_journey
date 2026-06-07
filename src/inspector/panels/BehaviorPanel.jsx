import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

function transitionSummary(matrix = {}) {
  return Object.entries(matrix).flatMap(([from, transitions]) => (
    Object.entries(transitions).map(([to, probability]) => `${from} -> ${to} ${format(probability)}`)
  ));
}

export default function BehaviorPanel({ world }) {
  const signatures = world?.behaviorSignatures;
  if (!signatures || !Object.keys(signatures).length) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Behavior</h3>
      <div style={{ maxHeight: 360, overflow: 'auto' }}>
        {Object.entries(signatures).map(([agentId, signature]) => (
          <div key={agentId} style={{ marginBottom: 10 }}>
            <strong>{agentId}</strong>
            <div>
              Dominant: {signature.dominantActions
                .map(entry => `${entry.action} ${entry.count}`)
                .join(', ') || 'none'}
            </div>
            <div>
              Heatmap: {Object.entries(signature.actionHeatmap || {})
                .map(([action, frequency]) => `${action} ${format(frequency)}`)
                .join(', ') || 'none'}
            </div>
            <div>Exploration: {format(signature.explorationIndex)}</div>
            <div>Stability: {format(signature.stabilityScore)}</div>
            <div>
              Loops: {signature.loopPatterns
                .slice(0, 3)
                .map(loop => `${loop.pattern.join(' -> ')} x${loop.repetitions}`)
                .join(', ') || 'none'}
            </div>
            <div>
              Transitions: {transitionSummary(signature.transitionMatrix).slice(0, 4).join(', ') || 'none'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

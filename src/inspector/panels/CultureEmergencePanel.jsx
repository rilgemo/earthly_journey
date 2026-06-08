import React from 'react';
const { resolveCultureEmergence } = require('../../simulation/culture/cultureEmergenceResolver');

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

export default function CultureEmergencePanel({ trace = [], world = {} }) {
  const settlementSnapshot = world?.settlementSnapshot || world?.settlements || {};
  const result = resolveCultureEmergence({
    traces: trace,
    settlementSnapshot,
    context: {
      demandIndex: world?.demandIndex,
      resourceGeography: world?.resourceGeography,
      migrationPressure: world?.migrationPressure
    }
  });
  const { culture, cultureTrace } = result;

  if (!cultureTrace.detectedPatterns.length) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Culture Emergence</h3>
      <div>Culture: {culture.cultureId}</div>
      <div>Stability: {format(cultureTrace.stabilityScore)}</div>
      <div>Convergence: {format(cultureTrace.convergenceIndex)}</div>
      <div>Drift: {format(cultureTrace.driftIndex)}</div>
      <div>
        Patterns: {cultureTrace.detectedPatterns
          .map(pattern => `${pattern.action}:${pattern.count}`)
          .join(', ') || 'none'}
      </div>
      <div>
        Typology: {Object.entries(culture.typologyComposition || {})
          .map(([typeId, count]) => `${typeId}:${count}`)
          .join(', ') || 'none'}
      </div>
      <div style={{ maxHeight: 180, overflow: 'auto', marginTop: 8 }}>
        {cultureTrace.clusterMapping.map(cluster => (
          <div key={cluster.clusterId}>
            {cluster.clusterId} agents:{cluster.agentCount} actions:{cluster.actionCount}
          </div>
        ))}
      </div>
    </div>
  );
}

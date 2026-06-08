import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

export default function CultureEmergencePanel({ world = {}, cultureReport }) {
  const result = cultureReport || world?.cultureEmergence || world?.cultureReport || null;
  const culture = result?.culture || world?.culture || null;
  const cultureTrace = result?.cultureTrace || world?.cultureTrace || null;

  if (!culture || !cultureTrace?.detectedPatterns?.length) return null;

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
        {(cultureTrace.clusterMapping || []).map(cluster => (
          <div key={cluster.clusterId}>
            {cluster.clusterId} agents:{cluster.agentCount} actions:{cluster.actionCount}
          </div>
        ))}
      </div>
    </div>
  );
}

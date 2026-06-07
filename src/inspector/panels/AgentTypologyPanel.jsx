import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

function collectSnapshots(trace = [], world = {}) {
  const fromTrace = trace.flatMap(tick => (
    (tick.agents || []).map(agent => agent.agentTypologySnapshot).filter(Boolean)
  ));
  const fromWorld = Object.values(world?.agentTypologySnapshots || {});
  return [...fromTrace, ...fromWorld];
}

function typeDistribution(snapshots) {
  return snapshots.reduce((result, snapshot) => {
    result[snapshot.typeId] = (result[snapshot.typeId] || 0) + 1;
    return result;
  }, {});
}

export default function AgentTypologyPanel({ trace = [], world = {} }) {
  const snapshots = collectSnapshots(trace, world);
  if (!snapshots.length) return null;

  const distribution = typeDistribution(snapshots);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Agent Typology</h3>
      <div>
        Distribution: {Object.entries(distribution)
          .map(([typeId, count]) => `${typeId} ${count}`)
          .join(', ')}
      </div>
      <div style={{ maxHeight: 360, overflow: 'auto', marginTop: 8 }}>
        {snapshots.slice(-40).reverse().map((snapshot, index) => (
          <div key={`${snapshot.agentId}-${index}`} style={{ marginBottom: 10 }}>
            <strong>{snapshot.agentId}</strong>
            <div>Type: {snapshot.typeId}</div>
            <div>Deviation: {format(snapshot.deviationFromBaseline)}</div>
            <div>
              Sensitivity: field {format(snapshot.influenceSummary?.fieldSensitivity)}
              {' '}social {format(snapshot.influenceSummary?.socialCouplingStrength)}
              {' '}memory {format(snapshot.influenceSummary?.memoryPersistenceBias)}
              {' '}volatility {format(snapshot.influenceSummary?.actionVolatility)}
            </div>
            <div>
              Weights: {(snapshot.activeWeights || [])
                .map(weight => `${weight.action}:${format(weight.modifier)}`)
                .join(', ') || 'none'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

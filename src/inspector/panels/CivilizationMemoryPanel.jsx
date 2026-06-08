import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

export default function CivilizationMemoryPanel({ world = {}, civilizationMemoryReport }) {
  const result = civilizationMemoryReport || world?.civilizationMemoryReport || world?.civilizationMemoryResult || null;
  const civilizationMemory = result?.civilizationMemory || world?.civilizationMemory || null;
  const civilizationMemoryTrace = result?.civilizationMemoryTrace || world?.civilizationMemoryTrace || null;

  if (!civilizationMemory || !civilizationMemoryTrace?.memoryGraph?.nodes?.length) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Civilization Memory</h3>
      <div>Memory: {civilizationMemory.memoryId}</div>
      <div>Persistence: {format(civilizationMemoryTrace.persistenceScore)}</div>
      <div>Compression: {format(civilizationMemoryTrace.compressionRatio)}</div>
      <div>Drift Resistance: {format(civilizationMemory.driftResistanceIndex)}</div>
      <div style={{ maxHeight: 180, overflow: 'auto', marginTop: 8 }}>
        {(civilizationMemoryTrace.memoryGraph.nodes || []).map(node => (
          <div key={node.id}>
            {node.id} weight:{format(node.weight)} type:{node.type}
          </div>
        ))}
      </div>
      <div>
        Stable: {(civilizationMemoryTrace.stableNodes || []).map(node => node.id).join(', ') || 'none'}
      </div>
      <div>
        Drift: {(civilizationMemoryTrace.driftEvents || []).map(event => event.memoryId).join(', ') || 'none'}
      </div>
    </div>
  );
}

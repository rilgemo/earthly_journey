import React from 'react';
const { resolveCultureEmergence } = require('../../simulation/culture/cultureEmergenceResolver');
const { buildCivilizationMemory } = require('../../simulation/civilizationMemory/civilizationMemoryBuilder');

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

export default function CivilizationMemoryPanel({ trace = [], world = {} }) {
  const cultureResult = resolveCultureEmergence({
    traces: trace,
    settlementSnapshot: world?.settlementSnapshot || world?.settlements || {},
    context: {
      demandIndex: world?.demandIndex,
      resourceGeography: world?.resourceGeography,
      migrationPressure: world?.migrationPressure
    }
  });
  const result = buildCivilizationMemory({
    cultureTraces: [cultureResult.cultureTrace],
    settlementSnapshots: [world?.settlementSnapshot || world?.settlements || {}],
    behavioralHistory: Object.values(world?.behaviorSignatures || {}),
    demandHistory: world?.demandHistory || [],
    resourceHistory: world?.resourceHistory || []
  });
  const { civilizationMemory, civilizationMemoryTrace } = result;

  if (!civilizationMemoryTrace.memoryGraph.nodes.length) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Civilization Memory</h3>
      <div>Memory: {civilizationMemory.memoryId}</div>
      <div>Persistence: {format(civilizationMemoryTrace.persistenceScore)}</div>
      <div>Compression: {format(civilizationMemoryTrace.compressionRatio)}</div>
      <div>Drift Resistance: {format(civilizationMemory.driftResistanceIndex)}</div>
      <div style={{ maxHeight: 180, overflow: 'auto', marginTop: 8 }}>
        {civilizationMemoryTrace.memoryGraph.nodes.map(node => (
          <div key={node.id}>
            {node.id} weight:{format(node.weight)} type:{node.type}
          </div>
        ))}
      </div>
      <div>
        Stable: {civilizationMemoryTrace.stableNodes.map(node => node.id).join(', ') || 'none'}
      </div>
      <div>
        Drift: {civilizationMemoryTrace.driftEvents.map(event => event.memoryId).join(', ') || 'none'}
      </div>
    </div>
  );
}

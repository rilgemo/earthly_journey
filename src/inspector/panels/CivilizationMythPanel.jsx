import React from 'react';
const { resolveCultureEmergence } = require('../../simulation/culture/cultureEmergenceResolver');
const { buildCivilizationMemory } = require('../../simulation/civilizationMemory/civilizationMemoryBuilder');
const { generateCivilizationMyth } = require('../../simulation/civilizationMyth/mythGenerator');

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

export default function CivilizationMythPanel({ trace = [], world = {} }) {
  const cultureResult = resolveCultureEmergence({
    traces: trace,
    settlementSnapshot: world?.settlementSnapshot || world?.settlements || {},
    context: {
      demandIndex: world?.demandIndex,
      resourceGeography: world?.resourceGeography,
      migrationPressure: world?.migrationPressure
    }
  });
  const memoryResult = buildCivilizationMemory({
    cultureTraces: [cultureResult.cultureTrace],
    settlementSnapshots: [world?.settlementSnapshot || world?.settlements || {}],
    behavioralHistory: Object.values(world?.behaviorSignatures || {}),
    demandHistory: world?.demandHistory || [],
    resourceHistory: world?.resourceHistory || []
  });
  const { myth, mythTrace } = generateCivilizationMyth(memoryResult);

  if (!mythTrace.symbolicNodes.length) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Civilization Myth</h3>
      <div>Myth: {myth.mythId}</div>
      <div>Stability: {format(mythTrace.stabilityIndex)}</div>
      <div>Moral: {myth.moralFraming}</div>
      <div style={{ maxHeight: 180, overflow: 'auto', marginTop: 8 }}>
        {mythTrace.narrativeClusters.map(statement => (
          <div key={statement.statementId}>{statement.text}</div>
        ))}
      </div>
      <div>
        Symbols: {mythTrace.symbolicNodes.map(node => node.symbolicEntity).join(', ') || 'none'}
      </div>
      <div>
        Contradictions: {mythTrace.contradictionMap.length}
      </div>
    </div>
  );
}

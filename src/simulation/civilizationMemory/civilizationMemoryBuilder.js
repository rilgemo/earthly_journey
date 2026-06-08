const { extractCrossGenerationalPatterns } = require('./crossGenerationalPatternExtractor');
const { compressPatterns } = require('./memoryCompressionEngine');
const { analyzeStabilityPersistence } = require('./stabilityPersistenceAnalyzer');
const { constructMemoryGraph } = require('./memoryGraphConstructor');
const { calculateCivilizationDrift } = require('./civilizationDriftModel');

function buildCivilizationMemory(input = {}) {
  const patterns = extractCrossGenerationalPatterns(input);
  const compression = compressPatterns(patterns);
  const stability = analyzeStabilityPersistence({
    compressedPatterns: compression.compressedPatterns,
    settlementSnapshots: input.settlementSnapshots || [],
    resourceHistory: input.resourceHistory || []
  });
  const memoryGraph = constructMemoryGraph(compression.compressedPatterns);
  const drift = calculateCivilizationDrift(memoryGraph, stability);
  const memoryId = `civilization-memory:${memoryGraph.nodes.map(node => node.id).join('|') || 'none'}`;
  const civilizationMemory = Object.freeze({
    memoryId,
    originTimeWindow: Object.freeze({
      start: input.startTick || 0,
      end: input.endTick || Math.max(0, (input.cultureTraces || []).length)
    }),
    persistentPatterns: Object.freeze(compression.compressedPatterns),
    structuralStabilityScore: stability.structuralStabilityScore,
    crossAgentPersistenceIndex: stability.crossAgentPersistenceIndex,
    environmentalCouplingStrength: stability.environmentalCouplingStrength,
    driftResistanceIndex: drift.driftResistanceIndex
  });

  return Object.freeze({
    civilizationMemory,
    civilizationMemoryTrace: Object.freeze({
      memoryGraph,
      stableNodes: drift.stableNodes,
      decayedNodes: drift.decayedNodes,
      driftEvents: drift.driftEvents,
      compressionRatio: compression.compressionRatio,
      persistenceScore: stability.structuralStabilityScore
    })
  });
}

module.exports = {
  buildCivilizationMemory
};

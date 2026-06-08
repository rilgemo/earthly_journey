const { mapSymbolicEntities } = require('./symbolicMappingEngine');
const { compressNarratives } = require('./narrativeCompressionEngine');
const { reinterpretCauses } = require('./causalReinterpretationModel');
const { analyzeMythStability, detectContradictions } = require('./mythStabilityAnalyzer');
const { buildIdentityNarrativeGraph } = require('./identityNarrativeGraph');
const { buildMythTrace } = require('./mythTraceBuilder');

function buildIdentityClaims(symbolicEntities = []) {
  return Object.freeze(symbolicEntities.map(entity => Object.freeze({
    claimId: `identity:${entity.sourceMemory}`,
    statement: `We are shaped by ${entity.symbolicEntity}`,
    sourceMemory: entity.sourceMemory
  })).sort((first, second) => first.claimId.localeCompare(second.claimId)));
}

function generateCivilizationMyth({ civilizationMemory = {}, civilizationMemoryTrace = {} } = {}) {
  const symbolicEntities = mapSymbolicEntities(civilizationMemoryTrace.memoryGraph || {});
  const narrativeStatements = compressNarratives(civilizationMemory, symbolicEntities);
  const causalInterpretations = reinterpretCauses(civilizationMemoryTrace, symbolicEntities);
  const identityClaims = buildIdentityClaims(symbolicEntities);
  const stabilityScore = analyzeMythStability({
    narrativeStatements,
    causalInterpretations,
    civilizationMemory
  });
  const contradictionMap = detectContradictions(causalInterpretations);
  const mythGraph = buildIdentityNarrativeGraph({ narrativeStatements, symbolicEntities });
  const mythId = `myth:${symbolicEntities.map(entity => entity.symbolicEntity).join('|') || 'none'}`;
  const myth = Object.freeze({
    mythId,
    originMemoryClusters: Object.freeze((civilizationMemoryTrace.memoryGraph?.nodes || []).map(node => node.id)),
    narrativeStatements,
    causalInterpretations,
    symbolicEntities,
    moralFraming: stabilityScore >= 0.5 ? 'persistence is virtue' : 'instability requires explanation',
    identityClaims,
    stabilityScore
  });

  return Object.freeze({
    myth,
    mythTrace: buildMythTrace({
      mythGraph,
      narrativeStatements,
      symbolicEntities,
      causalInterpretations,
      identityClaims,
      stabilityIndex: stabilityScore,
      contradictionMap
    })
  });
}

module.exports = {
  generateCivilizationMyth,
  buildIdentityClaims
};

const TOP_K_CANDIDATES = 3;

function computePopulationPressure(agents) {
  const total = agents.filter(agent => agent.life?.alive !== false && !agent._pendingDeath).length;
  return Math.max(0, Math.min(1, total / 20));
}

function computeFertilityPressure(agents) {
  const eligible = agents.filter(
    agent => agent.life?.alive !== false && !agent._pendingDeath && agent.life?.lifeStage === 'adult'
  ).length;
  const total = agents.filter(agent => agent.life?.alive !== false && !agent._pendingDeath).length;
  if (!total) return 0;
  return eligible / total;
}

function computeStabilityModifier(world) {
  const stability = world.lastStabilityTrace?.metrics?.compositeStability;
  if (!Number.isFinite(stability)) return 0;
  return Math.max(-0.2, Math.min(0.2, (stability - 0.5) * 0.4));
}

function computeDynamicThreshold(agents, world) {
  const populationPressure = computePopulationPressure(agents);
  const fertilityPressure = computeFertilityPressure(agents);
  const stabilityModifier = computeStabilityModifier(world);
  return Math.max(0.3, Math.min(0.9, 0.6 + populationPressure * 0.2 - fertilityPressure * 0.1 - stabilityModifier));
}

function selectMode(probabilityVector) {
  const { pairAttractor, groupAttractor, independentAttractor } = probabilityVector;
  if (independentAttractor > 0.65) return 'suppression';
  if (groupAttractor > pairAttractor && groupAttractor > 0.55) return 'cluster';
  if (pairAttractor > 0.55) return 'pair';
  return 'asymmetric';
}

function computeConfidence(pairResult, threshold) {
  const probability = pairResult.probabilityVector.pairAttractor;
  const margin = probability - threshold;
  return Math.max(0, Math.min(1, 0.5 + margin * 2));
}

function resolveReproductionEvents(tick, agents, reproductionField, world) {
  if (!Array.isArray(reproductionField) || !reproductionField.length) {
    return Object.freeze([]);
  }

  const threshold = computeDynamicThreshold(agents, world);

  const candidatesByA = new Map();

  for (const pairResult of reproductionField) {
    const probability = pairResult.probabilityVector.pairAttractor;
    if (probability < threshold) continue;

    const [idA, idB] = pairResult.pair;

    if (!candidatesByA.has(idA)) candidatesByA.set(idA, []);
    if (!candidatesByA.has(idB)) candidatesByA.set(idB, []);

    candidatesByA.get(idA).push({ pairResult, otherId: idB, probability });
    candidatesByA.get(idB).push({ pairResult, otherId: idA, probability });
  }

  const emittedPairs = new Set();
  const proposals = [];

  for (const [agentId, candidates] of candidatesByA) {
    candidates.sort((a, b) => b.probability - a.probability || a.otherId.localeCompare(b.otherId));
    const topK = candidates.slice(0, TOP_K_CANDIDATES);

    for (const { pairResult } of topK) {
      const pairKey = pairResult.pair.join(':');
      if (emittedPairs.has(pairKey)) continue;
      emittedPairs.add(pairKey);

      const probability = pairResult.probabilityVector.pairAttractor;
      proposals.push(Object.freeze({
        tick,
        parents: Object.freeze([...pairResult.pair]),
        probability,
        confidence: computeConfidence(pairResult, threshold),
        mode: selectMode(pairResult.probabilityVector),
        status: 'proposed'
      }));
    }
  }

  proposals.sort((a, b) =>
    b.probability - a.probability || a.parents[0].localeCompare(b.parents[0])
  );

  return Object.freeze(proposals);
}

function runReproductionEventEngine({ tick, agents, reproductionField, world }) {
  const proposals = resolveReproductionEvents(tick, agents, reproductionField, world);
  return Object.freeze({ proposals });
}

module.exports = { runReproductionEventEngine };

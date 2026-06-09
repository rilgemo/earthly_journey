// Layer C — Reproduction Commitment Boundary v1
// Causal firewall between Event Engine proposals and Birth System materialization.
// This module produces eligibility metadata only. It does NOT generate births,
// determine outcomes, or select parents. See REPRODUCTION_COMMITMENT_BOUNDARY_V1.md.

function computePopulationPressure(agents) {
  const total = agents.filter(agent => agent.life?.alive !== false && !agent._pendingDeath).length;
  return Math.max(0, Math.min(1, total / 20));
}

function computeFertilityPressure(agents) {
  const alive = agents.filter(agent => agent.life?.alive !== false && !agent._pendingDeath);
  const eligible = alive.filter(agent => agent.life?.lifeStage === 'adult');
  if (!alive.length) return 0;
  return eligible.length / alive.length;
}

function computeStabilityModifier(world) {
  const stability = world.lastStabilityTrace?.metrics?.compositeStability;
  if (!Number.isFinite(stability)) return 0;
  return Math.max(-0.2, Math.min(0.2, (stability - 0.5) * 0.4));
}

function buildAgentViabilityIndex(agents) {
  const index = new Map();
  for (const agent of agents) {
    const viable = (
      agent.life?.alive !== false &&
      !agent._pendingDeath &&
      agent.life?.lifeStage === 'adult'
    );
    index.set(agent.id, viable);
  }
  return index;
}

function computeRankIndex(proposals) {
  // For each participant, rank proposals by descending pairAttractor (informational only).
  const ranksByParticipant = new Map();
  for (const proposal of proposals) {
    for (const id of proposal.parents) {
      if (!ranksByParticipant.has(id)) ranksByParticipant.set(id, []);
      ranksByParticipant.get(id).push(proposal);
    }
  }
  // proposals are already sorted descending by probability from the engine
  const rankMap = new Map();
  for (const [, participantProposals] of ranksByParticipant) {
    participantProposals.forEach((proposal, index) => {
      const key = proposal.parents.join(':');
      const existing = rankMap.get(key) || {};
      // keep the best (lowest) rank seen for this pair across participants
      const rank = index + 1;
      rankMap.set(key, {
        ...existing,
        rankAmongParticipantCandidates: Math.min(existing.rankAmongParticipantCandidates ?? rank, rank)
      });
    });
  }
  return rankMap;
}

function buildProposalId(tick, participants) {
  return `${tick}:${[...participants].sort().join(':')}`;
}

function evaluateCommitmentBoundary({ tick, proposals, reproductionField, agents, world }) {
  if (!Array.isArray(proposals) || !proposals.length) {
    return Object.freeze({
      tick,
      evaluatedAt: tick,
      eligibleCandidates: Object.freeze([]),
      suppressedCandidates: Object.freeze([]),
      boundaryMetadata: Object.freeze({
        sourceProposalCount: 0,
        eligibleCount: 0,
        suppressedCount: 0,
        boundaryVersion: 'v1'
      })
    });
  }

  const viabilityIndex = buildAgentViabilityIndex(agents);
  const rankIndex = computeRankIndex(proposals);

  // Build a fast lookup from sorted pair key → field result for probabilityVector passthrough
  const fieldByPair = new Map();
  if (Array.isArray(reproductionField)) {
    for (const fieldResult of reproductionField) {
      fieldByPair.set(fieldResult.pair.join(':'), fieldResult);
    }
  }

  const contextFactors = Object.freeze({
    populationPressure: computePopulationPressure(agents),
    fertilityPressure: computeFertilityPressure(agents),
    stabilityModifier: computeStabilityModifier(world),
    // dominantMode is per-candidate; this summary uses the first proposal's mode
    dominantMode: proposals[0]?.mode ?? 'pair'
  });

  const eligibleCandidates = [];
  const suppressedCandidates = [];

  for (const proposal of proposals) {
    const participants = Object.freeze([...proposal.parents].sort());
    const proposalId = buildProposalId(tick, participants);
    const pairKey = participants.join(':');

    const fieldResult = fieldByPair.get(pairKey);
    const probabilityVector = fieldResult
      ? fieldResult.probabilityVector
      : Object.freeze({ pairAttractor: proposal.probability, groupAttractor: 0, independentAttractor: 0 });

    const rankEntry = rankIndex.get(pairKey) || {};
    const rankMetadata = Object.freeze({
      rankAmongParticipantCandidates: rankEntry.rankAmongParticipantCandidates ?? 1,
      probabilityMargin: Math.max(0, proposal.probability - 0.5)
    });

    // Structural eligibility: both participants must be viable at boundary evaluation time.
    // Mode and ranking are NOT eligibility criteria — see DFM-03, DFM-02.
    const allViable = participants.every(id => viabilityIndex.get(id) === true);
    const eligibilityStatus = allViable ? 'eligible' : 'suppressed';

    const candidate = Object.freeze({
      proposalId,
      participants,
      probabilityVector,
      contextFactors,
      rankMetadata,
      eligibilityStatus
    });

    if (eligibilityStatus === 'eligible') {
      eligibleCandidates.push(candidate);
    } else {
      suppressedCandidates.push(candidate);
    }
  }

  return Object.freeze({
    tick,
    evaluatedAt: tick,
    eligibleCandidates: Object.freeze(eligibleCandidates),
    suppressedCandidates: Object.freeze(suppressedCandidates),
    boundaryMetadata: Object.freeze({
      sourceProposalCount: proposals.length,
      eligibleCount: eligibleCandidates.length,
      suppressedCount: suppressedCandidates.length,
      boundaryVersion: 'v1'
    })
  });
}

module.exports = { evaluateCommitmentBoundary };

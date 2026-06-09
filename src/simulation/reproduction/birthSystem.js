// Layer D — Birth System v1 — Materialization Layer
// Sole population mutation authority for reproduction outcomes.
// Consumes reproductionCommitmentReport ONLY — never raw proposals or field output.
// Does NOT perform selection, ranking, probability evaluation, or coupling inference.
// See REPRODUCTION_COMMITMENT_BOUNDARY_V1.md for boundary guarantees.

const { createConditionCapacity } = require('../life/conditionCapacityModel');

const INFANT_MAX_AGE_TICKS = 90 * 365;

function buildNewbornId(tick, participants) {
  return `newborn:${tick}:${[...participants].sort().join(':')}`;
}

function resolveNewbornLocation(participants, survivingAgentIndex) {
  for (const id of [...participants].sort()) {
    const agent = survivingAgentIndex.get(id);
    if (agent?.location) return agent.location;
  }
  return 'unknown';
}

function materializeNewborn(candidate, survivingAgentIndex, tick) {
  const { participants } = candidate;
  const id = buildNewbornId(tick, participants);
  const location = resolveNewbornLocation(participants, survivingAgentIndex);

  return {
    id,
    type: 'newborn',
    location,
    life: {
      birthTick: tick,
      ageTicks: 0,
      lifeStage: 'juvenile',
      lifeCondition: 'alive',
      alive: true,
      maxAgeTicks: INFANT_MAX_AGE_TICKS
    },
    biology: createConditionCapacity(),
    lineage: Object.freeze({
      parentIds: Object.freeze([...participants].sort()),
      birthTick: tick,
      originTick: tick
    }),
    infantDependency: Object.freeze({
      birthTick: tick,
      stage: 'infant',
      active: true
    }),
    needs: { hunger: 0, rest: 0, curiosity: 0 },
    memory: { shortTerm: [], longTerm: [], recentEvents: [] },
    affinities: {},
    mana: { capacity: 10, current: 10, stability: 1, affinity: {} },
    stamina: 50
  };
}

function runBirthSystem({ commitmentReport, npcs, world }) {
  const tick = world.tick;
  const births = [];
  const rejectedCommitments = [];

  if (!commitmentReport || !Array.isArray(commitmentReport.eligibleCandidates)) {
    return Object.freeze({
      births: Object.freeze([]),
      rejectedCommitments: Object.freeze([]),
      tick
    });
  }

  // Build surviving-agent index from post-finalizePendingDeaths population.
  // This is the birth system's own independent structural viability gate —
  // it verifies participants survived death cleanup this tick.
  const survivingAgentIndex = new Map(npcs.map(agent => [agent.id, agent]));

  // Process candidates in stable order (commitmentReport already ordered deterministically).
  // Guard against duplicate newborn IDs from overlapping candidacies.
  const emittedIds = new Set();

  for (const candidate of commitmentReport.eligibleCandidates) {
    const newbornId = buildNewbornId(tick, candidate.participants);

    if (emittedIds.has(newbornId)) continue;

    // Independent viability gate: all participants must still exist in the
    // surviving population after finalizePendingDeaths. eligibilityStatus from
    // the boundary is advisory — this gate is the birth system's own authority.
    const allSurvived = candidate.participants.every(id => survivingAgentIndex.has(id));

    if (!allSurvived) {
      rejectedCommitments.push(Object.freeze({
        proposalId: candidate.proposalId,
        participants: candidate.participants,
        reason: 'participant_did_not_survive_death_cleanup'
      }));
      continue;
    }

    const newborn = materializeNewborn(candidate, survivingAgentIndex, tick);
    emittedIds.add(newbornId);
    births.push(newborn);
  }

  return Object.freeze({
    births: Object.freeze(births),
    rejectedCommitments: Object.freeze(rejectedCommitments),
    tick
  });
}

module.exports = { runBirthSystem };

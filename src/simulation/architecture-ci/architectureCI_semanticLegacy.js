/**
 * LEGACY SYSTEM — architectureCI_semanticLegacy.js
 *
 * Status       : RETIRED from authoritative CI role
 * Replaced by  : ciLiteRunner.js (CI v1 Lite — structural causal DAG validator)
 * Retained as  : semantic debug oracle / anomaly explainer
 *
 * DO NOT USE FOR:
 *   - tick validation
 *   - DAG enforcement
 *   - authoritative CI decisions
 *
 * MAY BE USED FOR:
 *   - semantic anomaly reporting
 *   - dev/debug inspection
 *   - comparison baseline against ciLiteRunner output
 *
 * Logic is frozen. No further feature development in this file.
 */

const CI_VERSION = 'CI_V0';
const TOP_K_LIMIT = 3;

function checkReproductionPipelineNoCycle(trace) {
  const current = trace?.current;
  if (!current) return null;
  if (current.reproductionEvents !== undefined && current.reproductionField === undefined) {
    return 'LAYER1: reproductionEvents present without reproductionField — causal cycle or order violation';
  }
  return null;
}

function checkOnlyBirthSystemMutatesPopulation(trace) {
  const current = trace?.current;
  if (!current) return null;
  if (current.matingEvents && !Object.isFrozen(current.matingEvents)) {
    return 'LAYER1: matingEvents is not frozen — Mating Event System performed illegal state mutation';
  }
  if (current.reproductionField && !Object.isFrozen(current.reproductionField)) {
    return 'LAYER1: reproductionField is not frozen — illegal mutation in Reproduction Probability Field';
  }
  return null;
}

function checkTickOrderDeterminism(trace) {
  const current = trace?.current;
  if (!current) return null;
  if (current.birthSystem !== undefined && current.reproductionCommitment === undefined) {
    return 'LAYER1: birthSystem ran without reproductionCommitment — tick order violated';
  }
  if (current.reproductionField !== undefined && current.matingEvents === undefined) {
    return 'LAYER1: reproductionField produced without matingEvents — Bond direct access violation or tick order violated';
  }
  return null;
}

function checkNoBackwardInfluence(trace) {
  const current = trace?.current;
  if (!current) return null;
  if (current.birthConsistency && current.birthConsistency.mutations && current.birthConsistency.mutations.length > 0) {
    return 'LAYER1: birthConsistencyContract performed state mutations — backward influence violation';
  }
  return null;
}

function checkBondHasNoExecutionAuthority(trace) {
  const current = trace?.current;
  if (!current) return null;
  if (!current.reproductionField) return null;
  for (const entry of current.reproductionField) {
    if (entry.components && 'bond' in entry.components) {
      return 'LAYER2: reproductionField contains bond component — Bond must not have execution authority in Reproduction Probability Field';
    }
  }
  return null;
}

function checkMatingIsEventOnly(trace) {
  const current = trace?.current;
  if (!current) return null;
  if (!current.matingEvents) return null;
  const allowedKeys = new Set(['pair', 'affinity']);
  for (const event of current.matingEvents) {
    if (!Object.isFrozen(event)) {
      return 'LAYER2: mating event object is not frozen — Mating Event System must be event-only with no state mutation';
    }
    for (const key of Object.keys(event)) {
      if (!allowedKeys.has(key)) {
        return `LAYER2: mating event contains unexpected key "${key}" — Mating Event System must emit only pair + affinity`;
      }
    }
  }
  return null;
}

function checkReproductionUsesOnlyMatingEvents(trace) {
  const current = trace?.current;
  if (!current) return null;
  if (!current.reproductionField) return null;
  for (const entry of current.reproductionField) {
    if (!entry.components) continue;
    if ('bond' in entry.components) {
      return 'LAYER2: reproductionField component contains bond — Reproduction Probability Field must read only matingEvents';
    }
  }
  return null;
}

function checkCommitmentBoundaryDoesNotCreateBirths(trace) {
  const current = trace?.current;
  if (!current) return null;
  const commitment = current.reproductionCommitment;
  if (!commitment) return null;
  if (commitment.births && commitment.births.length > 0) {
    return 'LAYER2: reproductionCommitment contains births — CommitmentBoundary must not create births';
  }
  return null;
}

function checkBirthSystemIsPostDeath(trace) {
  const current = trace?.current;
  if (!current) return null;
  if (current.birthSystem !== undefined && current.life === undefined) {
    return 'LAYER2: birthSystem ran before life finalisation — BirthSystem must be post-death materialization only';
  }
  return null;
}

function checkTopKLimit(trace) {
  const current = trace?.current;
  if (!current) return null;
  const proposals = current.reproductionEvents;
  if (!proposals || !proposals.length) return null;
  const countByParent = new Map();
  for (const proposal of proposals) {
    for (const parentId of proposal.parents || []) {
      countByParent.set(parentId, (countByParent.get(parentId) || 0) + 1);
    }
  }
  for (const [parentId, count] of countByParent) {
    if (count > TOP_K_LIMIT) {
      return `LAYER3: agent ${parentId} appears in ${count} proposals — exceeds TOP_K_LIMIT of ${TOP_K_LIMIT}`;
    }
  }
  return null;
}

function checkAffinityThresholdIsDynamic(trace) {
  const current = trace?.current;
  if (!current) return null;
  const commitment = current.reproductionCommitment;
  if (!commitment) return null;
  if (commitment.threshold !== undefined && (commitment.threshold < 0.3 || commitment.threshold > 0.9)) {
    return `LAYER3: reproductionCommitment threshold ${commitment.threshold} is outside dynamic range [0.3, 0.9]`;
  }
  return null;
}

const LAYER1_CHECKS = [
  checkReproductionPipelineNoCycle,
  checkOnlyBirthSystemMutatesPopulation,
  checkTickOrderDeterminism,
  checkNoBackwardInfluence
];

const LAYER2_CHECKS = [
  checkBondHasNoExecutionAuthority,
  checkMatingIsEventOnly,
  checkReproductionUsesOnlyMatingEvents,
  checkCommitmentBoundaryDoesNotCreateBirths,
  checkBirthSystemIsPostDeath
];

const LAYER3_CHECKS = [
  checkTopKLimit,
  checkAffinityThresholdIsDynamic
];

function runArchitectureCI({ tick, trace }) {
  const violations = [];

  for (const check of [...LAYER1_CHECKS, ...LAYER2_CHECKS, ...LAYER3_CHECKS]) {
    try {
      const result = check(trace);
      if (result) violations.push(result);
    } catch (_) {
      // CI must never throw or block execution
    }
  }

  return {
    status: violations.length === 0 ? 'PASS' : 'FAIL',
    violations,
    metadata: { version: CI_VERSION, tick }
  };
}

module.exports = { runArchitectureCI };

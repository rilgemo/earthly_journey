// Birth Consistency Contract Layer v1
// Post-materialization observer. Read-only. Does not modify births, agents, or world state.
// Runs AFTER Birth System v1, BEFORE trace finalization.
// See AGENTS.md (Observation Layer authority) and REPRODUCTION_COMMITMENT_BOUNDARY_V1.md.

const { createConditionCapacity } = require('../life/conditionCapacityModel');

// ---------------------------------------------------------------------------
// Rule 1 — No Duplicate Birth IDs
// ---------------------------------------------------------------------------

function checkNoDuplicateIds(births, previousTickState) {
  const violations = [];
  const seenInThisBatch = new Set();

  const previousIds = new Set(
    (previousTickState?.agents || []).map(a => a.id)
  );

  for (const birth of births) {
    if (seenInThisBatch.has(birth.id)) {
      violations.push({
        rule: 'NO_DUPLICATE_BIRTH_IDS',
        severity: 'FAIL',
        birthId: birth.id,
        detail: 'Birth ID appears more than once in this tick batch'
      });
    }
    seenInThisBatch.add(birth.id);

    if (previousIds.has(birth.id)) {
      violations.push({
        rule: 'NO_DUPLICATE_BIRTH_IDS',
        severity: 'FAIL',
        birthId: birth.id,
        detail: 'Birth ID already exists in previous tick state'
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Rule 2 — No Ghost Births (parents must be traceable)
// ---------------------------------------------------------------------------

function checkNoGhostBirths(births, previousTickState, currentAgents) {
  const violations = [];
  const knownIds = new Set([
    ...(previousTickState?.agents || []).map(a => a.id),
    ...currentAgents.map(a => a.id)
  ]);

  for (const birth of births) {
    const parentIds = birth.lineage?.parentIds || [];
    for (const parentId of parentIds) {
      if (!knownIds.has(parentId)) {
        violations.push({
          rule: 'NO_GHOST_BIRTHS',
          severity: 'FAIL',
          birthId: birth.id,
          missingParentId: parentId,
          detail: 'Parent ID not found in previousTickState or currentAgents'
        });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Rule 3 — No Temporal Leakage
// ---------------------------------------------------------------------------

function checkTemporalConsistency(births, tick, previousTickState) {
  const violations = [];
  const previousAgentIds = new Set((previousTickState?.agents || []).map(a => a.id));

  for (const birth of births) {
    if (birth.life?.birthTick !== tick) {
      violations.push({
        rule: 'NO_TEMPORAL_LEAKAGE',
        severity: 'FAIL',
        birthId: birth.id,
        expectedTick: tick,
        actualBirthTick: birth.life?.birthTick,
        detail: 'birth.life.birthTick does not equal current tick'
      });
    }

    if (previousAgentIds.has(birth.id)) {
      violations.push({
        rule: 'NO_TEMPORAL_LEAKAGE',
        severity: 'FAIL',
        birthId: birth.id,
        detail: 'Birth agent ID already existed in the previous tick state'
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Rule 4 — Structural Stability Check
// ---------------------------------------------------------------------------

const REQUIRED_BIOLOGY_DIMENSIONS = ['structural', 'metabolic', 'immune', 'neural'];
const VALID_CAPACITY_STATES = ['full', 'reduced', 'minimal'];
const VALID_CONDITION_STATES = ['sound', 'strained', 'impaired', 'collapsed'];

function isBiologyCompliant(biology) {
  if (!biology || typeof biology !== 'object') return false;
  const { capacity, condition } = biology;
  if (!capacity || !condition) return false;
  return REQUIRED_BIOLOGY_DIMENSIONS.every(dim =>
    VALID_CAPACITY_STATES.includes(capacity[dim]) &&
    VALID_CONDITION_STATES.includes(condition[dim])
  );
}

function checkStructuralStability(births) {
  const violations = [];

  for (const birth of births) {
    if (!isBiologyCompliant(birth.biology)) {
      violations.push({
        rule: 'STRUCTURAL_STABILITY',
        severity: 'FAIL',
        birthId: birth.id,
        detail: 'birth.biology does not satisfy conditionCapacityModel schema'
      });
    }

    if (!Object.isFrozen(birth.lineage)) {
      violations.push({
        rule: 'STRUCTURAL_STABILITY',
        severity: 'FAIL',
        birthId: birth.id,
        detail: 'birth.lineage is not frozen — mutable lineage reference detected'
      });
    }

    if (!Object.isFrozen(birth.lineage?.parentIds)) {
      violations.push({
        rule: 'STRUCTURAL_STABILITY',
        severity: 'FAIL',
        birthId: birth.id,
        detail: 'birth.lineage.parentIds is not frozen'
      });
    }

    if (typeof birth.id !== 'string' || !birth.id.length) {
      violations.push({
        rule: 'STRUCTURAL_STABILITY',
        severity: 'FAIL',
        birthId: birth.id,
        detail: 'birth.id is missing or not a string'
      });
    }

    if (birth.life?.lifeStage !== 'juvenile') {
      violations.push({
        rule: 'STRUCTURAL_STABILITY',
        severity: 'FAIL',
        birthId: birth.id,
        detail: `Newborn lifeStage must be "juvenile", got "${birth.life?.lifeStage}"`
      });
    }

    if (birth.life?.ageTicks !== 0) {
      violations.push({
        rule: 'STRUCTURAL_STABILITY',
        severity: 'FAIL',
        birthId: birth.id,
        detail: `Newborn ageTicks must be 0, got ${birth.life?.ageTicks}`
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Rule 5 — No Cross-Tick Mutation
// ---------------------------------------------------------------------------

function checkNoCrossTick(births, previousTickState, currentAgents) {
  const violations = [];

  // Detect if any parent agent object was mutated by checking for
  // birth-system-exclusive fields that should not exist on existing agents.
  const birthSystemFields = ['lineage', 'infantDependency'];
  const existingAgentIds = new Set(currentAgents.map(a => a.id));

  for (const agent of currentAgents) {
    // Newborns added this tick are now in currentAgents — skip them
    if (agent.id && agent.id.startsWith('newborn:')) continue;

    for (const field of birthSystemFields) {
      if (Object.prototype.hasOwnProperty.call(agent, field)) {
        violations.push({
          rule: 'NO_CROSS_TICK_MUTATION',
          severity: 'FAIL',
          agentId: agent.id,
          mutatedField: field,
          detail: `Existing agent acquired birth-exclusive field "${field}" — cross-tick mutation detected`
        });
      }
    }
  }

  // Verify lineage graph nodes are frozen (no mutable parent references from births)
  for (const birth of births) {
    const parentIds = birth.lineage?.parentIds || [];
    for (const parentId of parentIds) {
      const parentAgent = currentAgents.find(a => a.id === parentId);
      if (parentAgent && Object.prototype.hasOwnProperty.call(parentAgent, 'lineage')) {
        violations.push({
          rule: 'NO_CROSS_TICK_MUTATION',
          severity: 'FAIL',
          birthId: birth.id,
          agentId: parentId,
          detail: 'Parent agent has a lineage field — this must only exist on newborns'
        });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main contract evaluator
// ---------------------------------------------------------------------------

function evaluateBirthConsistencyContract({ tick, births, previousTickState, currentAgents, lineageGraph, worldSnapshot }) {
  if (!Array.isArray(births) || !births.length) {
    return Object.freeze({
      tick,
      status: 'PASS',
      violations: Object.freeze([]),
      summary: Object.freeze({ totalBirths: 0, validBirths: 0, invalidBirths: 0 }),
      metadata: Object.freeze({
        duplicateCheck: true,
        lineageIntegrity: true,
        temporalConsistency: true
      })
    });
  }

  const agents = Array.isArray(currentAgents) ? currentAgents : [];

  const allViolations = [
    ...checkNoDuplicateIds(births, previousTickState),
    ...checkNoGhostBirths(births, previousTickState, agents),
    ...checkTemporalConsistency(births, tick, previousTickState),
    ...checkStructuralStability(births),
    ...checkNoCrossTick(births, previousTickState, agents)
  ];

  const invalidBirthIds = new Set(allViolations.map(v => v.birthId).filter(Boolean));
  const totalBirths = births.length;
  const invalidBirths = invalidBirthIds.size;
  const validBirths = totalBirths - invalidBirths;

  const duplicateViolations = allViolations.filter(v => v.rule === 'NO_DUPLICATE_BIRTH_IDS');
  const ghostViolations = allViolations.filter(v => v.rule === 'NO_GHOST_BIRTHS');
  const temporalViolations = allViolations.filter(v => v.rule === 'NO_TEMPORAL_LEAKAGE');

  return Object.freeze({
    tick,
    status: allViolations.length === 0 ? 'PASS' : 'FAIL',
    violations: Object.freeze(allViolations.map(v => Object.freeze(v))),
    summary: Object.freeze({ totalBirths, validBirths, invalidBirths }),
    metadata: Object.freeze({
      duplicateCheck: duplicateViolations.length === 0,
      lineageIntegrity: ghostViolations.length === 0,
      temporalConsistency: temporalViolations.length === 0
    })
  });
}

module.exports = { evaluateBirthConsistencyContract };

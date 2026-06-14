'use strict';

/**
 * skillLandscape.js — read-only diagnostic
 *
 * Prints a full skill landscape snapshot after tick 5:
 * which agent skills exist, and how each skill maps to each action's
 * skillScore via intentScorer's getPureSkillAffinity logic.
 *
 * Does NOT modify any simulation logic, scoring, or weights.
 *
 * Usage: node src/simulation/debug/skillLandscape.js
 */

const { createArea, world } = require('../worldField');
const { createNPC }         = require('../agentModel');
const { tickManager }       = require('../tickManager');
const { TraceCollector }    = require('../traceCollector');
const { ACTION_SKILLS }     = require('../skills/skillSystem');

// Bootstrap world using same pattern as traceMana.js
world.tick = 0;
if (world.areas) world.areas.clear();
world.demandIndex = {};
world.demandHistory = [];
world.stabilityGains = undefined;
world.stabilityHistory = [];
world.emergenceHistory = {};
world.fieldPerturbationQueue = [];
world.lineageEngine = undefined;

const meadow = createArea('meadow', { fire: 0, water: 0, earth: 0.2, arcane: 0.05 });
const town   = createArea('town',   { fire: 0, water: 0, earth: 0,   arcane: 0.02 });
world.addArea(meadow);
world.addArea(town);

const npcs = [
  createNPC({ id: 'npc_1', location: 'meadow', skills: { farming: 20, lifeManipulation: 5 } }),
  createNPC({ id: 'npc_2', location: 'meadow', skills: { arcaneTheory: 20, arcaneManipulation: 15 } }),
  createNPC({ id: 'npc_3', location: 'town',   skills: { forging: 20, mining: 15, crafting: 5 } }),
];

// Run 5 ticks so skills settle via skillGain
const N_TICKS = 5;
const tracer = new TraceCollector(N_TICKS + 5);
for (let t = 0; t < N_TICKS; t++) {
  tickManager(npcs, world, tracer);
}

const snap = tracer.getLatest();

/**
 * Replicates getPureSkillAffinity(agent, actionId) * 0.3 from intentScorer,
 * and returns per-skill contribution breakdown.
 */
function computeSkillBreakdown(agent, actionId) {
  const relevant = ACTION_SKILLS[actionId] || [];
  const skills = agent.skills || {};

  if (!relevant.length) {
    return { skillScore: 0, sourceSkills: [] };
  }

  const sourceSkills = relevant.map(skill => {
    const level = skills[skill] || 0;
    // Each skill contributes equally: level / n, then * 0.3 for final score
    const contribution = (level / relevant.length) * 0.3;
    return { skill, level, contribution };
  });

  const avgLevel = sourceSkills.reduce((s, e) => s + e.level, 0) / relevant.length;
  const skillScore = avgLevel * 0.3;

  return { skillScore, sourceSkills };
}

function dumpSkillLandscape(agent, intentCandidates) {
  const skills = agent.skills || {};

  // Top 5 skills by level
  const topSkills = Object.entries(skills)
    .filter(([, level]) => level > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, level]) => ({ name, level }));

  // All actions with their skillScore and contributing skills
  const allActionIds = Object.keys(ACTION_SKILLS);

  // Merge with actual pipeline scores if available, otherwise compute locally
  const pipelineScores = {};
  if (Array.isArray(intentCandidates)) {
    for (const c of intentCandidates) {
      pipelineScores[c.intent] = c.components?.skillScore ?? null;
    }
  }

  const actionSkillScores = allActionIds
    .map(actionId => {
      const { skillScore: computed, sourceSkills } = computeSkillBreakdown(agent, actionId);
      const pipeline = pipelineScores[actionId];
      return {
        actionId,
        skillScore: pipeline !== null && pipeline !== undefined ? pipeline : computed,
        pipelineScore: pipeline,
        computedScore: computed,
        sourceSkills: sourceSkills.filter(s => s.level > 0)
      };
    })
    .sort((a, b) => b.skillScore - a.skillScore);

  return {
    agentId: agent.id,
    topSkills,
    actionSkillScores
  };
}

// Print landscape for each agent
for (const npc of npcs) {
  const agentSnap = snap.agents.find(a => a.agentId === npc.id);
  const intentCandidates = agentSnap?.candidateIntents || [];

  const landscape = dumpSkillLandscape(npc, intentCandidates);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Agent: ${landscape.agentId}`);
  console.log(`${'='.repeat(60)}`);

  console.log('\nTop skills:');
  if (landscape.topSkills.length === 0) {
    console.log('  (no skills above 0)');
  } else {
    for (const s of landscape.topSkills) {
      console.log(`  ${s.name.padEnd(20)} level=${s.level.toFixed(2)}`);
    }
  }

  console.log('\nAction skill scores (sorted by skillScore desc):');
  console.log('  action              skillScore  pipeline  computed  source skills');
  console.log('  ------------------  ----------  --------  --------  -------------');
  for (const a of landscape.actionSkillScores) {
    const pipeline = a.pipelineScore !== null && a.pipelineScore !== undefined
      ? a.pipelineScore.toFixed(3)
      : '  n/a';
    const computed = a.computedScore.toFixed(3);
    const score = a.skillScore.toFixed(3);
    const sources = a.sourceSkills.length
      ? a.sourceSkills.map(s => `${s.skill}(${s.level.toFixed(1)}→${s.contribution.toFixed(3)})`).join(', ')
      : '—';
    console.log(`  ${a.actionId.padEnd(20)}  ${score.padEnd(10)}  ${pipeline.padEnd(8)}  ${computed.padEnd(8)}  ${sources}`);
  }

  // Finding summary for this agent
  const meditateRow = landscape.actionSkillScores.find(a => a.actionId === 'meditate');
  const nonZeroRows = landscape.actionSkillScores.filter(a => a.skillScore > 0 && a.actionId !== 'meditate');
  const maxOther = nonZeroRows.length ? Math.max(...nonZeroRows.map(a => a.skillScore)) : 0;

  console.log('\nFinding:');
  if (!meditateRow || meditateRow.skillScore === 0) {
    console.log('  meditate.skillScore = 0 → skill is NOT a factor for meditate here');
  } else if (meditateRow.skillScore > maxOther * 1.5) {
    const driver = meditateRow.sourceSkills[0];
    console.log(`  Case A likely: meditate wins skill channel because ${driver?.skill || 'unknown'} is high (level=${driver?.level?.toFixed(2) || '?'})`);
    console.log('  → initial skill distribution in agentModel may be biased');
  } else if (maxOther < 0.01) {
    console.log('  Case B likely: meditate has unique skill coverage — other actions map to zero-level skills');
    console.log('  → action→skill mapping gives meditate uncontested coverage');
  } else {
    console.log('  Case C likely: skill scores are broadly similar — skill is not the root differentiator');
    console.log('  → look at influence/memory/demand channels for actual dominance cause');
  }
}

console.log('\n');

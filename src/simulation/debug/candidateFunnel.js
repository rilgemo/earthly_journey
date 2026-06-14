'use strict';

/**
 * candidateFunnel.js — read-only diagnostic
 *
 * At tick 5, for each agent, shows where identity differentiation is lost:
 * before scoring (filter/availability), during scoring (influence/demand),
 * or at resolution (winner override).
 *
 * Does NOT modify any simulation logic, scoring, or weights.
 *
 * Usage: node src/simulation/debug/candidateFunnel.js
 */

const { createArea, world } = require('../worldField');
const { createNPC }         = require('../agentModel');
const { tickManager }       = require('../tickManager');
const { TraceCollector }    = require('../traceCollector');
const { ACTIONS, getAvailableActions } = require('../actions');
const { ACTION_REGISTRY }   = require('../actionRegistry');

// Bootstrap — same pattern as skillLandscape.js
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

const N_TICKS = 5;
const tracer = new TraceCollector(N_TICKS + 5);
for (let t = 0; t < N_TICKS; t++) {
  tickManager(npcs, world, tracer);
}

const snap = tracer.getLatest();
const totalActionsInRegistry = new Set(ACTION_REGISTRY).size;

for (const npc of npcs) {
  const agentSnap = snap.agents.find(a => a.agentId === npc.id);
  if (!agentSnap) {
    console.log(`\n[${npc.id}] no trace found`);
    continue;
  }

  const candidateIntents = agentSnap.candidateIntents || [];
  const winner = agentSnap.actionSelected;

  // --- Funnel counts ---
  // generatedCandidates: re-evaluate availability at current agent state
  const generated = getAvailableActions(npc);
  const generatedIds = new Set(generated.map(a => a.id));

  // scored: those that appear in candidateIntents (intentPipeline output)
  const scoredIds = new Set(candidateIntents.map(c => c.intent));

  // communication-blocked: scored but communicationScore <= -50 (effectively -100)
  const communicationBlocked = candidateIntents.filter(
    c => typeof c.components?.communicationScore === 'number' && c.components.communicationScore < -50
  ).length;

  // --- Top-skill action for this agent ---
  // Use skillScore from candidateIntents; fall back to 0 if absent
  const bySkill = candidateIntents
    .filter(c => typeof c.components?.skillScore === 'number')
    .sort((a, b) => b.components.skillScore - a.components.skillScore);

  const topSkillCandidate = bySkill[0] || null;
  const topSkillAction = topSkillCandidate
    ? {
        action: topSkillCandidate.intent,
        skillScore: topSkillCandidate.components.skillScore,
        finalScore: topSkillCandidate.score,
        survived: scoredIds.has(topSkillCandidate.intent)
      }
    : null;

  // --- Top 5 final scored actions ---
  const finalScored = candidateIntents
    .map(c => ({
      action: c.intent,
      totalScore: c.score,
      skillScore:     c.components?.skillScore     ?? 0,
      influenceScore: c.components?.influenceScore ?? 0,
      memoryScore:    c.components?.memoryScore    ?? 0,
      demandScore:    c.components?.demandScore    ?? 0,
      needScore:      c.components?.needScore      ?? 0
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  // --- Case classification ---
  let caseLabel = '?';
  let caseDetail = '';

  if (!topSkillAction) {
    caseLabel = 'UNKNOWN';
    caseDetail = 'no skill scores available in candidateIntents';
  } else if (!topSkillAction.survived) {
    caseLabel = 'A';
    caseDetail = `${topSkillAction.action} never reached scoring (filtered before intentPipeline)`;
  } else {
    const topSkillInFinal = finalScored.find(f => f.action === topSkillAction.action);
    const winnerInFinal   = finalScored.find(f => f.action === winner);
    const topSkillIsWinner = topSkillAction.action === winner;

    if (topSkillIsWinner) {
      caseLabel = 'NONE';
      caseDetail = `${topSkillAction.action} won — no identity loss`;
    } else if (topSkillInFinal && winnerInFinal && winnerInFinal.totalScore > topSkillInFinal.totalScore) {
      caseLabel = 'B';
      caseDetail = `${topSkillAction.action} scored but lost to ${winner} on total score (${topSkillInFinal.totalScore.toFixed(2)} vs ${winnerInFinal.totalScore.toFixed(2)})`;
    } else {
      caseLabel = 'C';
      caseDetail = `${topSkillAction.action} may have had higher score but ${winner} won at resolution`;
    }
  }

  // --- Print ---
  console.log(`\n${'='.repeat(64)}`);
  console.log(`Agent: ${npc.id}`);
  console.log(`${'='.repeat(64)}`);

  console.log('\nCandidate funnel:');
  console.log(`  totalActions (registry):   ${totalActionsInRegistry}`);
  console.log(`  generatedCandidates:       ${generated.length}`);
  console.log(`  scored (intentPipeline):   ${candidateIntents.length}`);
  console.log(`  communicationBlocked:      ${communicationBlocked}`);

  if (topSkillAction) {
    console.log('\nTop-skill action:');
    console.log(`  action:      ${topSkillAction.action}`);
    console.log(`  skillScore:  ${topSkillAction.skillScore.toFixed(3)}`);
    console.log(`  finalScore:  ${topSkillAction.finalScore !== null ? topSkillAction.finalScore.toFixed(3) : 'n/a'}`);
    console.log(`  survived:    ${topSkillAction.survived}`);
  } else {
    console.log('\nTop-skill action: none (no skill scores in trace)');
  }

  console.log('\nFinal scored (top 5 by totalScore):');
  console.log('  action              total    skill    influence  memory   demand   need');
  console.log('  ------------------  -------  -------  ---------  -------  -------  -------');
  for (const f of finalScored) {
    const mark = f.action === winner ? ' ← winner' : '';
    console.log(
      `  ${f.action.padEnd(20)}` +
      `  ${f.totalScore.toFixed(3).padEnd(7)}` +
      `  ${f.skillScore.toFixed(3).padEnd(7)}` +
      `  ${f.influenceScore.toFixed(3).padEnd(9)}` +
      `  ${f.memoryScore.toFixed(3).padEnd(7)}` +
      `  ${f.demandScore.toFixed(3).padEnd(7)}` +
      `  ${f.needScore.toFixed(3)}` +
      mark
    );
  }

  console.log(`\nWinner: ${winner}`);
  console.log(`\nCase ${caseLabel}: ${caseDetail}`);
}

console.log('\n');

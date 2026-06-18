'use strict';

/**
 * contributionAudit.js — read-only diagnostic
 *
 * Runs 24 ticks. For each tick and agent, records the winning action's
 * full score component breakdown plus influenceScore subcomposition
 * (needs-driven vs field-driven vs memory-driven vs social-driven).
 *
 * Does NOT modify any simulation logic, scoring, or weights.
 *
 * Usage: node src/simulation/debug/contributionAudit.js
 *
 * influenceSubcomposition method:
 *   For the winning action's influence channels (ACTION_INFLUENCE_PROFILES),
 *   sum contributions per source from agentTrace.influenceSources:
 *     fieldDriven   ← influenceSources.world[channel]
 *     memoryDriven  ← influenceSources.memory[channel]
 *     socialDriven  ← influenceSources.social[channel]
 *     needsDriven   ← influenceSources.needs[channel]
 *   This is directly readable from the existing trace output.
 */

const { createArea, world }         = require('../worldField');
const { createNPC }                 = require('../agentModel');
const { tickManager }               = require('../tickManager');
const { TraceCollector }            = require('../traceCollector');
const { ACTION_INFLUENCE_PROFILES } = require('../influenceProfiles');

// Bootstrap — same pattern as other diagnostics
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

const N_TICKS = 24;
const tracer = new TraceCollector(N_TICKS + 5);

// Per-agent accumulators keyed by agentId
const accumulators = {};
for (const npc of npcs) {
  accumulators[npc.id] = {
    count: 0,
    score: { skill: 0, need: 0, memory: 0, influence: 0, demand: 0, field: 0, typology: 0, base: 0 },
    influenceSub: { needsDriven: 0, fieldDriven: 0, memoryDriven: 0, socialDriven: 0 },
    actionCategories: {}  // actionId → { needScore, influenceScore, count }
  };
}

// Run ticks
for (let t = 0; t < N_TICKS; t++) {
  tickManager(npcs, world, tracer);
  const snap = tracer.getLatest();
  if (!snap) continue;

  for (const agentSnap of snap.agents) {
    const acc = accumulators[agentSnap.agentId];
    if (!acc) continue;

    const winner = agentSnap.actionSelected;
    if (!winner) continue;

    const candidates = agentSnap.candidateIntents || [];
    const winnerIntent = candidates.find(c => c.intent === winner);
    if (!winnerIntent) continue;

    const comp = winnerIntent.components || {};
    acc.count += 1;

    // Score components
    acc.score.skill     += comp.skillScore       || 0;
    acc.score.need      += comp.needScore        || 0;
    acc.score.memory    += comp.memoryScore      || 0;
    acc.score.influence += comp.influenceScore   || 0;
    acc.score.demand    += comp.demandScore      || 0;
    acc.score.field     += comp.environmentScore || 0;
    acc.score.typology  += comp.typologyScore    || 0;
    acc.score.base      += comp.base             || 0;

    // Influence subcomposition for winning action
    const sources  = agentSnap.influenceSources || {};
    const channels = ACTION_INFLUENCE_PROFILES[winner] || [];
    const wSrc = sources.world  || {};
    const mSrc = sources.memory || {};
    const sSrc = sources.social || {};
    const nSrc = sources.needs  || {};

    for (const ch of channels) {
      acc.influenceSub.fieldDriven  += wSrc[ch] || 0;
      acc.influenceSub.memoryDriven += mSrc[ch] || 0;
      acc.influenceSub.socialDriven += sSrc[ch] || 0;
      acc.influenceSub.needsDriven  += nSrc[ch] || 0;
    }

    // Action-category tracking
    if (!acc.actionCategories[winner]) {
      acc.actionCategories[winner] = { needScore: 0, influenceScore: 0, count: 0 };
    }
    acc.actionCategories[winner].needScore      += comp.needScore      || 0;
    acc.actionCategories[winner].influenceScore += comp.influenceScore || 0;
    acc.actionCategories[winner].count          += 1;
  }
}

// Action category labels
const ACTION_CATEGORIES = {
  rest: 'rest-like', meditate: 'rest-like',
  forage: 'work-like', farm: 'work-like', hunt: 'work-like',
  gather_water: 'work-like', chop_wood: 'work-like', mine: 'work-like',
  forge: 'work-like', craft_item: 'work-like',
  communicate: 'social-like', share_information: 'social-like',
  trade: 'social-like', teach: 'social-like',
  cast_magic: 'magic-like', channel_arcane: 'magic-like',
  study_arcane: 'magic-like',
  attack: 'work-like', defend: 'work-like', flee: 'work-like', move: 'work-like'
};

function avg(sum, count) { return count ? sum / count : 0; }
function pct(v, total)   { return total === 0 ? 0 : Math.round((v / total) * 1000) / 10; }
function f2(v)           { return v.toFixed(4); }

// ── Print results ────────────────────────────────────────────────────────────

for (const npc of npcs) {
  const acc = accumulators[npc.id];
  const n   = acc.count || 1;

  const avgScore = Object.fromEntries(
    Object.entries(acc.score).map(([k, v]) => [k, avg(v, n)])
  );
  const totalScore = Object.values(avgScore).reduce((s, v) => s + Math.abs(v), 0) || 1;

  const avgSub = Object.fromEntries(
    Object.entries(acc.influenceSub).map(([k, v]) => [k, avg(v, n)])
  );
  const totalSub = Object.values(avgSub).reduce((s, v) => s + Math.abs(v), 0) || 1;

  // Dominant channel
  const dominantChannel = Object.entries(avgScore)
    .filter(([k]) => k !== 'base')
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))[0]?.[0] || 'unknown';

  // needDominance: needs-driven share of influence subcomposition > 50%
  const needDominance = (avgSub.needsDriven / totalSub) > 0.5;

  console.log(`\n${'='.repeat(68)}`);
  console.log(`Agent: ${npc.id}   (${n} ticks recorded)`);
  console.log(`${'='.repeat(68)}`);

  console.log('\naverageScoreComposition (of winning action):');
  console.log('  channel     avg value    % of total');
  console.log('  ----------  -----------  ----------');
  for (const [k, v] of Object.entries(avgScore).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))) {
    console.log(`  ${k.padEnd(12)}  ${f2(v).padEnd(11)}  ${pct(v, totalScore)}%`);
  }

  console.log('\ninfluenceSubcomposition (winning action channels only):');
  console.log('  source        avg value    % of influence');
  console.log('  ------------  -----------  --------------');
  for (const [k, v] of Object.entries(avgSub).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))) {
    console.log(`  ${k.padEnd(14)}  ${f2(v).padEnd(11)}  ${pct(v, totalSub)}%`);
  }

  console.log(`\n  dominantChannel: ${dominantChannel}`);
  console.log(`  needDominance:   ${needDominance} (needsDriven = ${pct(avgSub.needsDriven, totalSub)}% of influence subcomposition)`);

  // Action category breakdown
  const categoryRollup = {};
  for (const [actionId, data] of Object.entries(acc.actionCategories)) {
    const cat = ACTION_CATEGORIES[actionId] || 'other';
    if (!categoryRollup[cat]) categoryRollup[cat] = { needScore: 0, influenceScore: 0, count: 0 };
    categoryRollup[cat].needScore      += data.needScore;
    categoryRollup[cat].influenceScore += data.influenceScore;
    categoryRollup[cat].count          += data.count;
  }

  console.log('\nAction-category breakdown (avg needScore / influenceScore per win):');
  console.log('  category       wins   avg needScore  avg influenceScore');
  console.log('  -------------  -----  -------------  ------------------');
  for (const [cat, data] of Object.entries(categoryRollup).sort(([, a], [, b]) => b.count - a.count)) {
    const c = data.count || 1;
    console.log(`  ${cat.padEnd(15)}  ${String(data.count).padEnd(5)}  ${f2(data.needScore / c).padEnd(13)}  ${f2(data.influenceScore / c)}`);
  }
}

console.log(`\n${'═'.repeat(68)}`);
console.log('Note on influenceSubcomposition availability:');
console.log('  influenceSources (world/memory/social/needs) IS present in');
console.log('  agentTrace (see tickManager.js simulateAgent return value,');
console.log('  field "influenceSources"). The subcomposition above is computed');
console.log('  by summing source contributions per channel for the winning action.');
console.log('  Source file: src/simulation/influenceSources.js');
console.log(`${'═'.repeat(68)}\n`);

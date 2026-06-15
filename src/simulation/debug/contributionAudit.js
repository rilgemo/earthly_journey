'use strict';

/**
 * Read-only 24-tick audit of winning-action score composition.
 *
 * Usage: node src/simulation/debug/contributionAudit.js
 */

const { createArea, world } = require('../worldField');
const { createNPC } = require('../agentModel');
const { tickManager } = require('../tickManager');
const { TraceCollector } = require('../traceCollector');
const { ACTION_INFLUENCE_PROFILES } = require('../influenceProfiles');

const TICKS = 24;
const SCORE_COMPONENTS = Object.freeze({
  skill: 'skillScore',
  need: 'needScore',
  memory: 'memoryScore',
  influence: 'influenceScore',
  demand: 'demandScore',
  field: 'environmentScore',
  typology: 'typologyScore'
});
const INFLUENCE_COMPONENTS = Object.freeze({
  needsDriven: 'needs',
  fieldDriven: 'world',
  memoryDriven: 'memory',
  socialDriven: 'social'
});

function resetWorld() {
  world.tick = 0;
  if (world.areas) world.areas.clear();
  world.demandIndex = {};
  world.demandHistory = [];
  world.stabilityGains = undefined;
  world.stabilityHistory = [];
  world.emergenceHistory = {};
  world.fieldPerturbationQueue = [];
  world.lineageEngine = undefined;
}

function createFixture() {
  resetWorld();
  world.addArea(createArea('meadow', { fire: 0, water: 0, earth: 0.2, arcane: 0.05 }));
  world.addArea(createArea('town', { fire: 0, water: 0, earth: 0, arcane: 0.02 }));

  return [
    createNPC({ id: 'npc_1', location: 'meadow', skills: { farming: 20, lifeManipulation: 5 } }),
    createNPC({ id: 'npc_2', location: 'meadow', skills: { arcaneTheory: 20, arcaneManipulation: 15 } }),
    createNPC({ id: 'npc_3', location: 'town', skills: { forging: 20, mining: 15, crafting: 5 } })
  ];
}

function emptyTotals(keys) {
  return Object.fromEntries(Object.keys(keys).map(key => [key, 0]));
}

function actionCategory(actionId, scoredCategory) {
  if (actionId === 'rest' || actionId === 'meditate') return 'rest-like';
  if (scoredCategory === 'social') return 'social-like';
  if (scoredCategory === 'magic') return 'magic-like';
  return 'work-like';
}

function influenceBreakdown(actionId, sources = {}) {
  const totals = emptyTotals(INFLUENCE_COMPONENTS);
  for (const channel of ACTION_INFLUENCE_PROFILES[actionId] || []) {
    for (const [label, sourceKey] of Object.entries(INFLUENCE_COMPONENTS)) {
      totals[label] += sources[sourceKey]?.[channel] || 0;
    }
  }
  return totals;
}

function withPercent(totals, denominator) {
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [
    key,
    {
      value: Number(value.toFixed(4)),
      percent: denominator === 0 ? 0 : Number(((value / denominator) * 100).toFixed(2))
    }
  ]));
}

function averageTotals(totals, count) {
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / count]));
}

const agents = createFixture();
const tracer = new TraceCollector(TICKS + 5);
const perAgent = new Map(agents.map(agent => [agent.id, {
  count: 0,
  score: emptyTotals(SCORE_COMPONENTS),
  influence: emptyTotals(INFLUENCE_COMPONENTS)
}]));
const categories = new Map();

for (let tick = 1; tick <= TICKS; tick += 1) {
  tickManager(agents, world, tracer);
  const snapshot = tracer.getLatest();

  for (const trace of snapshot.agents) {
    const winner = (trace.candidateIntents || []).find(candidate => candidate.intent === trace.actionSelected);
    if (!winner) continue;

    const aggregate = perAgent.get(trace.agentId);
    aggregate.count += 1;
    for (const [label, componentKey] of Object.entries(SCORE_COMPONENTS)) {
      aggregate.score[label] += winner.components?.[componentKey] || 0;
    }

    const subcomposition = influenceBreakdown(winner.intent, trace.influenceSources);
    for (const label of Object.keys(INFLUENCE_COMPONENTS)) {
      aggregate.influence[label] += subcomposition[label];
    }

    const category = actionCategory(winner.intent, winner.category);
    const categoryAggregate = categories.get(category) || { count: 0, needScore: 0, influenceScore: 0 };
    categoryAggregate.count += 1;
    categoryAggregate.needScore += winner.components?.needScore || 0;
    categoryAggregate.influenceScore += winner.components?.influenceScore || 0;
    categories.set(category, categoryAggregate);
  }
}

const agentAverages = [...perAgent.entries()].map(([agentId, aggregate]) => {
  const averageScore = averageTotals(aggregate.score, aggregate.count);
  const averageInfluence = averageTotals(aggregate.influence, aggregate.count);
  const scoreTotal = Object.values(averageScore).reduce((sum, value) => sum + value, 0);
  const influenceTotal = Object.values(averageInfluence).reduce((sum, value) => sum + value, 0);
  const dominantChannel = Object.entries(averageScore)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0][0];

  return {
    agentId,
    averageScoreComposition: withPercent(averageScore, scoreTotal),
    influenceSubcomposition: withPercent(averageInfluence, influenceTotal),
    dominantChannel,
    needDominance: averageInfluence.needsDriven > (scoreTotal * 0.5)
  };
});

const actionCategoryBreakdown = Object.fromEntries(
  ['rest-like', 'work-like', 'social-like', 'magic-like'].map(category => {
    const aggregate = categories.get(category) || { count: 0, needScore: 0, influenceScore: 0 };
    return [category, {
      winningActionCount: aggregate.count,
      averageNeedScore: aggregate.count ? Number((aggregate.needScore / aggregate.count).toFixed(4)) : 0,
      averageInfluenceScore: aggregate.count ? Number((aggregate.influenceScore / aggregate.count).toFixed(4)) : 0
    }];
  })
);

console.log(JSON.stringify({
  ticks: TICKS,
  finding: 'influenceSubcomposition is directly readable from trace.agents[].influenceSources',
  agents: agentAverages,
  actionCategoryBreakdown
}, null, 2));

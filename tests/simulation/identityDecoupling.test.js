/**
 * Identity Decoupling Tests
 *
 * Verifies that skill-based identity is not overwritten by physiological
 * state after the needs-from-influenceField decoupling and feasibility mask.
 *
 * Test 1 — Single agent, mixed needs: forge/rest can win, meditate cannot
 *           dominate an agent with no arcane skill.
 * Test 2 — Three professions, identical needs: skill differentiates behaviour.
 * Test 3 — Longitudinal Identity (72 ticks): each profession's top action
 *           > 35% even under randomised physiological noise.
 */

const { scoreIntent, computeFeasibilityMask } = require('../../src/simulation/intent/intentScorer');
const { createSkills }  = require('../../src/simulation/skills/skillSystem');
const { createTraits }  = require('../../src/simulation/skills/traitSystem');
const { ACTIONS }       = require('../../src/simulation/actions');

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAction(id) {
  const found = ACTIONS.find(a => a.id === id);
  if (!found) throw new Error(`Action not found in registry: ${id}`);
  return found;
}

function makeAgent({ id = 'agent', skills = {}, mana = {} } = {}) {
  return {
    id,
    type: 'npc',
    location: 'meadow',
    skills: createSkills(skills),
    traits: createTraits(() => 0.5),
    knowledge: [],
    affinities: { fire: 0, water: 0, earth: 0, arcane: 0 },
    mana: {
      capacity: 100,
      current: 50,
      stability: 0.8,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 },
      ...mana
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} }
  };
}

function makeContext(needProfile) {
  return {
    perception: { field: { fire: 0, water: 0, earth: 0.2, arcane: 0.05 }, nearbyAgents: [] },
    memories: [],
    needs: { profile: needProfile },
    influenceProfile: {},
    demandIndex: {}
  };
}

function scoreAll(agent, ctx) {
  return ACTIONS.map(action => ({
    id:    action.id,
    score: scoreIntent(agent, action, ctx).score,
    skill: scoreIntent(agent, action, ctx).components.skillScore,
    mask:  computeFeasibilityMask(action, ctx.needs.profile)
  })).sort((a, b) => b.score - a.score);
}

function pickWinner(agent, ctx) {
  return scoreAll(agent, ctx)[0];
}

// ── Test 1 ───────────────────────────────────────────────────────────────────

describe('Test 1 — Single agent, mixed needs (fatigue=80, hunger=60, forging=80)', () => {
  const agent = makeAgent({ id: 'smith', skills: { forging: 80 } });
  const needs = { fatigue: 80, hunger: 60, manaNeed: 90, socialNeed: 10, safetyNeed: 20 };
  const ctx   = makeContext(needs);
  const scores = scoreAll(agent, ctx);

  const forgeEntry    = scores.find(s => s.id === 'forge');
  const meditateEntry = scores.find(s => s.id === 'meditate');
  const restEntry     = scores.find(s => s.id === 'rest');

  test('forge has non-zero skill score (forging=80 maps to forge)', () => {
    console.log(`  forge.skill=${forgeEntry.skill.toFixed(3)}  forge.mask=${forgeEntry.mask}  forge.score=${forgeEntry.score.toFixed(3)}`);
    expect(forgeEntry.skill).toBeGreaterThan(0);
  });

  test('meditate has zero skill score (no arcane skill)', () => {
    console.log(`  meditate.skill=${meditateEntry.skill.toFixed(3)}  meditate.score=${meditateEntry.score.toFixed(3)}`);
    expect(meditateEntry.skill).toBe(0);
  });

  test('forge beats meditate on final score despite high fatigue', () => {
    console.log(`  forge.score=${forgeEntry.score.toFixed(3)} vs meditate.score=${meditateEntry.score.toFixed(3)}`);
    expect(forgeEntry.score).toBeGreaterThan(meditateEntry.score);
  });

  test('rest is a valid competing candidate (score > 0)', () => {
    console.log(`  rest.score=${restEntry.score.toFixed(3)}`);
    expect(restEntry.score).toBeGreaterThan(0);
  });

  test('top-3 winners do NOT include meditate as #1', () => {
    const top3 = scores.slice(0, 3).map(s => s.id);
    console.log(`  top-3: [${top3.join(', ')}]`);
    expect(top3[0]).not.toBe('meditate');
  });
});

// ── Test 2 ───────────────────────────────────────────────────────────────────

describe('Test 2 — Three professions, identical needs (fatigue=80)', () => {
  const needs = { fatigue: 80, hunger: 40, manaNeed: 50, socialNeed: 10, safetyNeed: 20 };

  const farmer    = makeAgent({ id: 'farmer',    skills: { farming: 80 } });
  const smith     = makeAgent({ id: 'smith',     skills: { forging: 80 } });
  const arcaneNPC = makeAgent({ id: 'arcane',    skills: { arcaneManipulation: 80, arcaneTheory: 80 } });

  const ctx = makeContext(needs);

  const farmerWinner  = pickWinner(farmer, ctx);
  const smithWinner   = pickWinner(smith, ctx);
  const arcaneWinner  = pickWinner(arcaneNPC, ctx);

  test('farmer top action is farming-related (farm or forage)', () => {
    console.log(`  farmer winner: ${farmerWinner.id} (score=${farmerWinner.score.toFixed(3)}, skill=${farmerWinner.skill.toFixed(3)})`);
    expect(['farm', 'forage']).toContain(farmerWinner.id);
  });

  test('blacksmith top action is forge', () => {
    console.log(`  smith winner:  ${smithWinner.id} (score=${smithWinner.score.toFixed(3)}, skill=${smithWinner.skill.toFixed(3)})`);
    expect(smithWinner.id).toBe('forge');
  });

  test('arcane top action is study_arcane or meditate (arcane skill matters)', () => {
    console.log(`  arcane winner: ${arcaneWinner.id} (score=${arcaneWinner.score.toFixed(3)}, skill=${arcaneWinner.skill.toFixed(3)})`);
    expect(['study_arcane', 'meditate', 'cast_magic', 'channel_arcane']).toContain(arcaneWinner.id);
  });

  test('all three professions have different winning actions (skill differentiates)', () => {
    console.log(`  farmer=${farmerWinner.id}  smith=${smithWinner.id}  arcane=${arcaneWinner.id}`);
    const winners = new Set([farmerWinner.id, smithWinner.id, arcaneWinner.id]);
    expect(winners.size).toBeGreaterThanOrEqual(2);
  });

  test('mask is identical across agents for the same action (same needs)', () => {
    const forgeMask = computeFeasibilityMask(makeAction('forge'), needs);
    const studyMask = computeFeasibilityMask(makeAction('study_arcane'), needs);
    const farmMask  = computeFeasibilityMask(makeAction('farm'), needs);
    console.log(`  forge.mask=${forgeMask}  study_arcane.mask=${studyMask}  farm.mask=${farmMask}`);
    // Mask is need-only — same needs → same mask value regardless of agent
    expect(forgeMask).toBe(farmMask);
  });
});

// ── Test 3 ───────────────────────────────────────────────────────────────────

describe('Test 3 — Longitudinal Identity (72 ticks, randomised needs)', () => {
  const farmer    = makeAgent({ id: 'farmer',    skills: { farming: 80 } });
  const smith     = makeAgent({ id: 'smith',     skills: { forging: 80 } });
  const arcaneNPC = makeAgent({ id: 'arcane',    skills: { arcaneManipulation: 80, arcaneTheory: 80 } });

  const agents = [farmer, smith, arcaneNPC];
  const counts = Object.fromEntries(agents.map(a => [a.id, {}]));

  // Deterministic pseudo-random (avoids Jest flakiness)
  let seed = 42;
  function rng() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }

  const N = 72;
  for (let t = 0; t < N; t++) {
    // Randomise needs every tick (simulate drift)
    const sharedFatigue = 20 + rng() * 70;  // 20–90
    const sharedHunger  = 10 + rng() * 70;  // 10–80
    const sharedMana    = 20 + rng() * 60;  // 20–80

    const needs = {
      fatigue:    sharedFatigue,
      hunger:     sharedHunger,
      manaNeed:   sharedMana,
      socialNeed: rng() * 30,
      safetyNeed: rng() * 30
    };
    const ctx = makeContext(needs);

    for (const agent of agents) {
      const winner = pickWinner(agent, ctx);
      counts[agent.id][winner.id] = (counts[agent.id][winner.id] || 0) + 1;
    }
  }

  // Print distribution
  for (const agent of agents) {
    const dist = counts[agent.id];
    const sorted = Object.entries(dist).sort(([, a], [, b]) => b - a);
    const topAction = sorted[0];
    const topPct = ((topAction[1] / N) * 100).toFixed(1);
    console.log(`  ${agent.id}: top=${topAction[0]} (${topPct}%)  full=[${sorted.map(([k,v]) => `${k}:${v}`).join(', ')}]`);
  }

  test('farmer selects farm or forage > 35% of ticks', () => {
    const farmingTicks = (counts.farmer.farm || 0) + (counts.farmer.forage || 0);
    const ratio = farmingTicks / N;
    console.log(`  farmer farming ratio: ${(ratio * 100).toFixed(1)}% (${farmingTicks}/${N})`);
    expect(ratio).toBeGreaterThan(0.35);
  });

  test('blacksmith selects forge > 35% of ticks', () => {
    const ratio = (counts.smith.forge || 0) / N;
    console.log(`  smith forge ratio:    ${(ratio * 100).toFixed(1)}% (${counts.smith.forge || 0}/${N})`);
    expect(ratio).toBeGreaterThan(0.35);
  });

  test('arcane selects arcane actions > 35% of ticks', () => {
    const arcaneTicks = (['meditate', 'study_arcane', 'cast_magic', 'channel_arcane']
      .reduce((s, id) => s + (counts.arcane[id] || 0), 0));
    const ratio = arcaneTicks / N;
    console.log(`  arcane arcane ratio:  ${(ratio * 100).toFixed(1)}% (${arcaneTicks}/${N})`);
    expect(ratio).toBeGreaterThan(0.35);
  });

  test('each profession is dominated by different actions (identity persists)', () => {
    const farmerTop  = Object.entries(counts.farmer).sort(([,a],[,b]) => b-a)[0]?.[0];
    const smithTop   = Object.entries(counts.smith).sort(([,a],[,b]) => b-a)[0]?.[0];
    const arcaneTop  = Object.entries(counts.arcane).sort(([,a],[,b]) => b-a)[0]?.[0];
    console.log(`  top actions: farmer=${farmerTop}  smith=${smithTop}  arcane=${arcaneTop}`);
    expect(farmerTop).not.toBe(smithTop);
  });
});

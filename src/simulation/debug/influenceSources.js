'use strict';

/**
 * influenceSources.js — read-only diagnostic
 *
 * Decomposes each action's influenceScore into its upstream source channels
 * (field, memory, social, needs) and reports which source drives meditate
 * dominance.
 *
 * Does NOT modify any simulation logic, scoring, or weights.
 *
 * Usage: node src/simulation/debug/influenceSources.js
 *
 * Architecture note:
 *   influenceScore is built from 4 sources in createInfluenceField():
 *     world  → WORLD_FIELD_INFLUENCE_PROFILES  (field values × profile weights)
 *     memory → MEMORY_INFLUENCE_PROFILES        (direct memories, non-social)
 *     social → MEMORY_INFLUENCE_PROFILES        (heard/social memories × 0.5)
 *     needs  → NEED_INFLUENCE_PROFILES          (needProfile values × weights)
 *
 *   Each source writes into named channels (e.g. "meditate", "rest", "magic").
 *   getActionInfluence() then sums the channels subscribed to by each action
 *   via ACTION_INFLUENCE_PROFILES.
 *
 *   "demand" and "typology" are intentScorer components, NOT part of
 *   influenceScore. They are reported separately for context.
 *
 *   "repeat_success" is written to influenceProfile by success memories,
 *   but NO action in ACTION_INFLUENCE_PROFILES reads it — it is a dead channel.
 */

const { createArea, world }         = require('../worldField');
const { createNPC }                 = require('../agentModel');
const { tickManager }               = require('../tickManager');
const { TraceCollector }            = require('../traceCollector');
const { ACTION_INFLUENCE_PROFILES } = require('../influenceProfiles');
const { ACTION_SKILLS }             = require('../skills/skillSystem');

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

/**
 * Decompose influenceScore for one action into its source contributions.
 *
 * For each channel the action subscribes to (ACTION_INFLUENCE_PROFILES),
 * attribute the channel's value to whichever source set it:
 *   fieldAffinity  ← influenceSources.world[channel]
 *   memory         ← influenceSources.memory[channel]  (direct, non-social)
 *   social         ← influenceSources.social[channel]  (heard memories × 0.5)
 *   needs          ← influenceSources.needs[channel]
 *   repeatSuccess  ← influenceSources.memory['repeat_success'] if subscribed
 *
 * demand and typology are pulled from intentScorer components (not influence).
 */
function decomposeActionInfluence(actionId, influenceSources, candidateComponent) {
  const channels = ACTION_INFLUENCE_PROFILES[actionId] || [];
  const { world: worldSrc = {}, memory: memorySrc = {}, social: socialSrc = {}, needs: needsSrc = {} } = influenceSources;

  let fieldAffinity   = 0;
  let memoryAmt       = 0;
  let socialAmt       = 0;
  let needsAmt        = 0;
  let repeatSuccess   = 0;

  const channelDetail = [];

  for (const ch of channels) {
    const wAmt = worldSrc[ch]  || 0;
    const mAmt = memorySrc[ch] || 0;
    const sAmt = socialSrc[ch] || 0;
    const nAmt = needsSrc[ch]  || 0;
    const total = wAmt + mAmt + sAmt + nAmt;

    fieldAffinity += wAmt;
    socialAmt     += sAmt;
    needsAmt      += nAmt;

    if (ch === 'repeat_success') {
      repeatSuccess += mAmt;
    } else {
      memoryAmt += mAmt;
    }

    if (total !== 0) {
      channelDetail.push({ channel: ch, world: wAmt, memory: mAmt, social: sAmt, needs: nAmt, total });
    }
  }

  // repeat_success channel: even if not in this action's subscription,
  // report global pool for context.
  const repeatSuccessPool = memorySrc.repeat_success || 0;

  const finalInfluence = fieldAffinity + memoryAmt + socialAmt + needsAmt + repeatSuccess;

  // demand and typology from intentScorer (separate layer)
  const demand   = candidateComponent?.demandScore   ?? null;
  const typology = candidateComponent?.typologyScore ?? null;

  const attributed = fieldAffinity + memoryAmt + socialAmt + needsAmt + repeatSuccess;
  const pipelineInfluence = candidateComponent?.influenceScore ?? null;
  const fallback = pipelineInfluence !== null ? pipelineInfluence - attributed : 0;

  // Normalised percent (relative to attributed total, excludes demand/typology)
  const total = Math.abs(attributed) || 1;
  const normalizedPercent = {
    fieldAffinity:  pct(fieldAffinity, total),
    memory:         pct(memoryAmt, total),
    social:         pct(socialAmt, total),
    needs:          pct(needsAmt, total),
    repeatSuccess:  pct(repeatSuccess, total),
  };

  return {
    action: actionId,
    channels,
    finalInfluence: pipelineInfluence ?? finalInfluence,
    components: {
      fieldAffinity,
      memory: memoryAmt,
      social: socialAmt,
      needs: needsAmt,
      repeatSuccess,
      repeatSuccessPool,
      demand,
      typology,
      fallback,
    },
    normalizedPercent,
    channelDetail,
  };
}

function pct(v, total) {
  return total === 0 ? 0 : Math.round((v / total) * 1000) / 10;
}

function topSkillActionFor(npc, candidateIntents) {
  const bySkill = (candidateIntents || [])
    .filter(c => typeof c.components?.skillScore === 'number')
    .sort((a, b) => b.components.skillScore - a.components.skillScore);
  return bySkill[0]?.intent || null;
}

function printInfluenceTree(decomp) {
  console.log(`  Channels subscribed: [${decomp.channels.join(', ')}]`);
  if (decomp.channelDetail.length === 0) {
    console.log('  (all channels are zero)');
  } else {
    for (const ch of decomp.channelDetail) {
      console.log(`  channel "${ch.channel}":  world=${fmt(ch.world)}  memory=${fmt(ch.memory)}  social=${fmt(ch.social)}  needs=${fmt(ch.needs)}  → ${fmt(ch.total)}`);
    }
  }
  const c = decomp.components;
  console.log(`  ─ attributed sum:     fieldAffinity=${fmt(c.fieldAffinity)}  memory=${fmt(c.memory)}  social=${fmt(c.social)}  needs=${fmt(c.needs)}  repeatSuccess=${fmt(c.repeatSuccess)}`);
  if (c.demand   !== null) console.log(`  ─ demand (scorer):    ${fmt(c.demand)}`);
  if (c.typology !== null) console.log(`  ─ typology (scorer):  ${fmt(c.typology)}`);
  if (Math.abs(c.fallback) > 0.001) console.log(`  ─ fallback/unattrib:  ${fmt(c.fallback)}`);
  console.log(`  ─ finalInfluence:     ${fmt(decomp.finalInfluence)}`);
  console.log('  normalised %:');
  const n = decomp.normalizedPercent;
  console.log(`    fieldAffinity=${n.fieldAffinity}%  memory=${n.memory}%  social=${n.social}%  needs=${n.needs}%  repeatSuccess=${n.repeatSuccess}%`);
}

function fmt(v) {
  if (v === null || v === undefined) return 'n/a';
  return Number(v).toFixed(4);
}

// ── Main output ─────────────────────────────────────────────────────────────

const agentDominanceSources = [];

for (const npc of npcs) {
  const agentSnap = snap.agents.find(a => a.agentId === npc.id);
  if (!agentSnap) { console.log(`\n[${npc.id}] no trace`); continue; }

  const candidateIntents  = agentSnap.candidateIntents || [];
  const influenceSources  = agentSnap.influenceSources || {};

  const candidateMap = Object.fromEntries(
    candidateIntents.map(c => [c.intent, c.components])
  );

  const allActionIds = Object.keys(ACTION_INFLUENCE_PROFILES);
  const decomps = allActionIds
    .map(id => decomposeActionInfluence(id, influenceSources, candidateMap[id] || null))
    .sort((a, b) => b.finalInfluence - a.finalInfluence);

  const meditateDecomp      = decomps.find(d => d.action === 'meditate');
  const topSkillActionId    = topSkillActionFor(npc, candidateIntents);
  const topSkillDecomp      = topSkillActionId ? decomps.find(d => d.action === topSkillActionId) : null;

  console.log(`\n${'='.repeat(68)}`);
  console.log(`Agent: ${npc.id}   winner: ${agentSnap.actionSelected}`);
  console.log(`${'='.repeat(68)}`);

  // Full action table
  console.log('\nAll actions by influence (desc):');
  console.log('  action              influence  field    memory   social   needs    demand   typology');
  console.log('  ------------------  ---------  -------  -------  -------  -------  -------  --------');
  for (const d of decomps) {
    const c = d.components;
    const infl = fmt(d.finalInfluence);
    const dem  = c.demand   !== null ? fmt(c.demand)   : '  n/a ';
    const typ  = c.typology !== null ? fmt(c.typology) : '  n/a ';
    console.log(
      `  ${d.action.padEnd(20)}` +
      `  ${infl.padEnd(9)}` +
      `  ${fmt(c.fieldAffinity).padEnd(7)}` +
      `  ${fmt(c.memory).padEnd(7)}` +
      `  ${fmt(c.social).padEnd(7)}` +
      `  ${fmt(c.needs).padEnd(7)}` +
      `  ${dem.padEnd(7)}` +
      `  ${typ}`
    );
  }

  // Meditate full tree
  if (meditateDecomp) {
    console.log('\n── meditate influence tree ──────────────────────────────────');
    printInfluenceTree(meditateDecomp);
  }

  // Top-skill action full tree
  if (topSkillDecomp && topSkillDecomp.action !== 'meditate') {
    console.log(`\n── ${topSkillDecomp.action} (top-skill action) influence tree ──────────`);
    printInfluenceTree(topSkillDecomp);
  }

  // Dominance source classification for this agent
  const med = meditateDecomp?.components || {};
  const sources = [
    { channel: 'fieldAffinity',  value: med.fieldAffinity  || 0, label: 'B. field affinity' },
    { channel: 'memory',         value: med.memory         || 0, label: 'A. history loop (direct memory)' },
    { channel: 'social',         value: med.social         || 0, label: 'A. history loop (social memory)' },
    { channel: 'needs',          value: med.needs          || 0, label: 'E. need/default influence' },
    { channel: 'repeatSuccess',  value: med.repeatSuccess  || 0, label: 'A. history loop (repeat_success)' },
  ];
  const totalMed = sources.reduce((s, x) => s + Math.abs(x.value), 0) || 1;
  const top = sources.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
  const confidence = Math.round((Math.abs(top.value) / totalMed) * 100);

  agentDominanceSources.push({
    agentId: npc.id,
    channel:      top.channel,
    label:        top.label,
    contribution: top.value,
    confidence:   `${confidence}%`,
    meditateInfluence: meditateDecomp?.finalInfluence ?? 0,
    repeatSuccessPool: med.repeatSuccessPool ?? 0,
  });
}

// ── Global summary ───────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(68)}`);
console.log('DOMINANCE_SOURCE per agent:');
console.log(`${'═'.repeat(68)}`);
for (const d of agentDominanceSources) {
  console.log(`\n  ${d.agentId}:`);
  console.log(`    channel:               ${d.channel}`);
  console.log(`    label:                 ${d.label}`);
  console.log(`    contribution:          ${fmt(d.contribution)}`);
  console.log(`    confidence:            ${d.confidence}`);
  console.log(`    meditate finalInfluence: ${fmt(d.meditateInfluence)}`);
  console.log(`    repeat_success pool:   ${fmt(d.repeatSuccessPool)}  (dead channel — no action consumes it)`);
}

// Structural finding
console.log(`\n${'─'.repeat(68)}`);
console.log('Structural finding (from code, not runtime):');
console.log('  ACTION_INFLUENCE_PROFILES lists "repeat_success" for NO action.');
console.log('  MEMORY_INFLUENCE_PROFILES.success writes to "repeat_success" channel.');
console.log('  → repeat_success influence pool is accumulated but never consumed.');
console.log('  → success memories contribute 0 to any action\'s influenceScore.');
console.log('  This rules out Case A (history loop via repeat_success).');
console.log('  Meditate influence comes from: arcane field × 0.75 (world) + manaNeed × 0.12 (needs).');
console.log(`${'─'.repeat(68)}\n`);

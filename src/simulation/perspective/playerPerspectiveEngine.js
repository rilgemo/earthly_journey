'use strict';

/**
 * Player Perspective Engine v1
 *
 * Filters the world through a single agent's eyes.
 * Transforms objective world state into subjective, biased perception.
 *
 * Input context:
 * {
 *   tick,
 *   agentId,        — the observing agent
 *   world,          — raw worldObj fields
 *   agents,         — full npcs array
 *   events,         — NarrativeEvent[] for this tick
 *   lineageEngine,  — optional
 *   narrativeMemory — optional
 * }
 *
 * Output (PlayerPerspective):
 * {
 *   tick,
 *   self:             { id, state, internalEnergy, lifeStage },
 *   perceivedWorld:   { nearbyAgents, visibleFields },
 *   perceivedEvents:  string[],
 *   perceivedLineage: { parents, children, depthAwareness },
 *   narrativeBias:    string[],
 *   uncertainty:      number  0–1
 * }
 */

const INFLUENCE_RADIUS = 3;  // units — agents within this count are "nearby"
const HIGH_ENERGY_THRESHOLD  = 0.7;
const LOW_ENERGY_THRESHOLD   = 0.3;

/**
 * buildPlayerPerspective(context) → frozen PlayerPerspective
 */
function buildPlayerPerspective(context) {
  const {
    tick,
    agentId,
    world          = {},
    agents         = [],
    events         = [],
    lineageEngine  = null,
    narrativeMemory = null
  } = context ?? {};

  const self  = _findAgent(agents, agentId);
  const alive = self ? self.life?.alive !== false : false;

  return Object.freeze({
    tick:             tick ?? null,
    self:             buildSelfView(self),
    perceivedWorld:   buildLocalWorld(self, world, agents),
    perceivedEvents:  filterEventsForAgent(events, self),
    perceivedLineage: buildLineageAwareness(self, lineageEngine),
    narrativeBias:    biasNarrative(narrativeMemory, self),
    uncertainty:      computeUncertainty(self, world, agents)
  });
}

// ─── sub-builders ─────────────────────────────────────────────────────────────

/**
 * buildSelfView(agent) → { id, state, internalEnergy, lifeStage }
 *
 * Translates raw agent stats into a first-person introspective view.
 */
function buildSelfView(agent) {
  if (!agent) {
    return { id: null, state: 'unknown', internalEnergy: null, lifeStage: 'unknown' };
  }

  const alive = agent.life?.alive !== false;
  const energy = agent.life?.energy ?? agent.mana ?? null;

  return {
    id:            agent.id,
    state:         alive ? 'alive' : 'dead',
    internalEnergy: energy,
    lifeStage:     agent.life?.lifeStage ?? 'unknown'
  };
}

/**
 * buildLocalWorld(agent, world, agents) → { nearbyAgents, visibleFields }
 *
 * Only agents within INFLUENCE_RADIUS are perceived.
 * Field values are degraded to qualitative labels.
 */
function buildLocalWorld(agent, world, agents) {
  const nearbyAgents = _filterNearby(agent, agents);

  const rawFields = world?.fields ?? {};
  const visibleFields = {};
  for (const [key, value] of Object.entries(rawFields)) {
    if (typeof value === 'number') {
      visibleFields[key] = _degradeValue(value);
    }
  }

  return { nearbyAgents, visibleFields };
}

/**
 * filterEventsForAgent(events, agent) → string[]
 *
 * Returns perception strings for events relevant to the agent.
 * Nearby events are perceived clearly; distant events are vague.
 */
function filterEventsForAgent(events, agent) {
  if (!Array.isArray(events) || events.length === 0) return [];

  const agentId = agent?.id;
  const perceived = [];

  for (const ev of events) {
    const actors = ev.actors ?? [];
    const isDirectActor = agentId && actors.includes(agentId);

    if (isDirectActor) {
      perceived.push(_describeEvent(ev, 'direct'));
    } else if (actors.length > 0 && ev.severity >= 0.7) {
      perceived.push(_describeEvent(ev, 'distant'));
    }
  }

  return perceived;
}

/**
 * buildLineageAwareness(agent, lineageEngine) →
 *   { parents, children, depthAwareness }
 *
 * depthAwareness = how many generations the agent can perceive (0–4).
 */
function buildLineageAwareness(agent, lineageEngine) {
  const empty = { parents: ['unknown'], children: [], depthAwareness: 0 };
  if (!agent || !lineageEngine) return empty;

  const rec = lineageEngine.getRecord(agent.id);
  if (!rec) return empty;

  const parents  = rec.parentIds.length > 0 ? [...rec.parentIds] : ['unknown'];
  const children = [...rec.childrenIds];

  // Depth awareness: how many ancestor generations are known
  const ancestors    = lineageEngine.getAncestors(agent.id);
  const depthAwareness = Math.min(4, ancestors.length > 0 ? rec.generation : 0);

  return { parents, children, depthAwareness };
}

/**
 * biasNarrative(narrativeMemory, agent) → string[]
 *
 * Returns the agent's subjective interpretation of recent world events.
 * State (alive/energy) biases how history is read.
 */
function biasNarrative(narrativeMemory, agent) {
  if (!narrativeMemory) return ['The world is beyond perception.'];

  const recent  = narrativeMemory.recent(3);
  if (recent.length === 0) return ['Nothing stirs.'];

  const energyLevel = agent?.life?.energy ?? agent?.mana ?? 0.5;
  const alive       = agent?.life?.alive !== false;

  const biased = recent.map(output => {
    const base = output.summary ?? '';
    if (!alive) return 'All fades to silence.';
    if (energyLevel < LOW_ENERGY_THRESHOLD) return _weaken(base);
    if (energyLevel > HIGH_ENERGY_THRESHOLD) return _amplify(base);
    return base;
  });

  // Deduplicate
  const seen = new Set();
  return biased.filter(s => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
}

/**
 * computeUncertainty(agent, world, agents) → number 0–1
 *
 * Higher when: fewer nearby agents, agent is weakened, world is unstable.
 */
function computeUncertainty(agent, world, agents) {
  if (!agent || agent.life?.alive === false) return 1.0;

  const nearby    = _filterNearby(agent, agents).length;
  const maxNearby = Math.max(1, (agents?.length ?? 0) - 1);
  // Isolation: fewer nearby = higher uncertainty
  const isolationScore = 1 - Math.min(1, nearby / Math.min(maxNearby, INFLUENCE_RADIUS));

  // Energy: low energy = higher uncertainty
  const energy = agent.life?.energy ?? agent.mana ?? 0.5;
  const energyScore = 1 - Math.min(1, Math.max(0, energy));

  // World stability: more extreme fields = higher uncertainty
  const fields = world?.fields ?? {};
  const fieldValues = Object.values(fields).filter(v => typeof v === 'number');
  const stabilityScore = fieldValues.length > 0
    ? fieldValues.reduce((sum, v) => sum + Math.abs(v - 0.5), 0) / fieldValues.length
    : 0;

  const uncertainty = 0.4 * isolationScore + 0.4 * energyScore + 0.2 * stabilityScore;
  return Math.round(Math.min(1, Math.max(0, uncertainty)) * 1000) / 1000;
}

// ─── private helpers ──────────────────────────────────────────────────────────

function _findAgent(agents, agentId) {
  if (!Array.isArray(agents) || !agentId) return null;
  return agents.find(a => a?.id === agentId) ?? null;
}

function _filterNearby(agent, agents) {
  if (!agent || !Array.isArray(agents)) return [];
  // Without spatial coordinates, use index-based proximity as a proxy
  const idx = agents.findIndex(a => a?.id === agent.id);
  if (idx === -1) return [];

  const nearby = [];
  for (let i = 0; i < agents.length; i++) {
    if (i === idx) continue;
    if (Math.abs(i - idx) <= INFLUENCE_RADIUS) {
      const a = agents[i];
      if (a?.id && a?.life?.alive !== false) nearby.push(a.id);
    }
  }
  return nearby;
}

function _degradeValue(value) {
  if (value >= HIGH_ENERGY_THRESHOLD) return 'high presence';
  if (value <= LOW_ENERGY_THRESHOLD)  return 'weak presence';
  return 'moderate presence';
}

function _describeEvent(ev, distance) {
  const type = ev.type ?? 'EVENT';
  const actors = ev.actors ?? [];

  if (distance === 'direct') {
    switch (type) {
      case 'BIRTH':      return `A new soul enters the world near you.`;
      case 'DEATH':      return `A life ends nearby — ${actors[0] ?? 'someone'} is gone.`;
      case 'STRUCTURE':  return `You sense a disturbance in the causal fabric.`;
      case 'ECOLOGY':    return `The balance around you shifts.`;
      case 'RELATIONSHIP': return `A bond forms between those around you.`;
      default:           return `Something significant happens.`;
    }
  } else {
    // distant — vague perception of high-severity events
    switch (type) {
      case 'BIRTH':     return `You sense a birth somewhere in the world.`;
      case 'DEATH':     return `A distant presence fades.`;
      case 'STRUCTURE': return `The world trembles far away.`;
      default:          return `Something stirs at the edge of awareness.`;
    }
  }
}

function _weaken(summary) {
  if (!summary) return 'The world blurs.';
  return summary.replace(/\.$/, '') + ', though your perception dims.';
}

function _amplify(summary) {
  if (!summary) return 'The world pulses with energy.';
  return summary.replace(/\.$/, '') + ' — you feel it vividly.';
}

module.exports = {
  buildPlayerPerspective,
  buildSelfView,
  buildLocalWorld,
  filterEventsForAgent,
  buildLineageAwareness,
  biasNarrative,
  computeUncertainty,
  INFLUENCE_RADIUS,
  HIGH_ENERGY_THRESHOLD,
  LOW_ENERGY_THRESHOLD
};

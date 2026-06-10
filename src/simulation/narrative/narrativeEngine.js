'use strict';

/**
 * Narrative Engine
 *
 * Pure transform: NarrativeEvent[] → NarrativeOutput
 *
 * Deterministic. No randomness. No AI generation.
 * "What happened this tick, expressed as sentences."
 *
 * NarrativeOutput:
 * {
 *   tick:       number,
 *   summary:    string,
 *   sentences:  [{ text, type, severity }],
 *   worldState: { generationPeak, totalBirths, totalDeaths, activeViolations }
 * }
 */

const SENTENCE_BUILDERS = Object.freeze({

  BIRTH(ev) {
    const { childId, parentIds, generation } = ev.data;
    const genLabel = generation != null ? ` (generation ${generation})` : '';
    if (parentIds.length >= 2) {
      return `${parentIds[0]} and ${parentIds[1]} brought ${childId} into the world${genLabel}.`;
    }
    if (parentIds.length === 1) {
      return `${childId} was born, lineage traced to ${parentIds[0]}${genLabel}.`;
    }
    return `${childId} entered the world${genLabel}.`;
  },

  DEATH(ev) {
    const { agentId, ageTicks } = ev.data;
    const ageNote = ageTicks != null ? ` after ${ageTicks} ticks` : '';
    return `${agentId} passed from the world${ageNote}.`;
  },

  RELATIONSHIP(ev) {
    const { actors } = ev;
    if (actors.length >= 2) {
      return `${actors[0]} and ${actors[1]} formed a bond.`;
    }
    return `A bond event was recorded.`;
  },

  STRUCTURE(ev) {
    const { violationType, from, to } = ev.data;
    switch (violationType) {
      case 'CAUSAL_REVERSAL':
        return `Causal flow reversed between ${from} and ${to} — the world's logic bent against itself.`;
      case 'LAYER_DRIFT':
        return `The module "${from}" shifted layers — structural drift detected.`;
      case 'HIGH_DRIFT':
        return `The world's architecture drifted significantly this tick.`;
      case 'CYCLE':
        return `A causal cycle formed — the world risks an infinite loop of consequence.`;
      case 'FORBIDDEN_EDGE':
        return `A forbidden causal link appeared between ${from} and ${to}.`;
      case 'LAYER_BREAK':
        return `A layer boundary was violated between ${from} and ${to}.`;
      default:
        return `A structural anomaly was detected in the world's causal fabric.`;
    }
  },

  ECOLOGY(ev) {
    const { pressureLevel } = ev.data;
    if (pressureLevel >= 0.9) return `The world strains under extreme resource pressure.`;
    if (pressureLevel >= 0.7) return `Resource scarcity rises across the world.`;
    return `Ecological conditions shifted this tick.`;
  }

});

/**
 * processEvents(events, tick?) → NarrativeOutput
 */
function processEvents(events, tick) {
  const resolvedTick = tick ?? events[0]?.tick ?? null;

  if (!events || events.length === 0) {
    return _output(resolvedTick, [], {});
  }

  const sentences = events.map(ev => {
    const builder = SENTENCE_BUILDERS[ev.type];
    const text    = builder ? builder(ev) : `An event of type ${ev.type} occurred.`;
    return Object.freeze({ text, type: ev.type, severity: ev.severity });
  });

  const worldState = _deriveWorldState(events);
  const summary    = _buildSummary(sentences, worldState);

  return _output(resolvedTick, sentences, worldState, summary);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function _output(tick, sentences, worldState, summary) {
  const allTypes = new Set(sentences.map(s => s.type));
  return Object.freeze({
    tick,
    summary:    summary ?? _buildSummary(sentences, worldState),
    sentences:  Object.freeze(sentences),
    worldState: Object.freeze(worldState),
    types:      Object.freeze([...allTypes])
  });
}

function _deriveWorldState(events) {
  let generationPeak  = 0;
  let totalBirths     = 0;
  let totalDeaths     = 0;
  let activeViolations = 0;

  for (const ev of events) {
    if (ev.type === 'BIRTH') {
      totalBirths++;
      const g = ev.data.generation ?? 0;
      if (g > generationPeak) generationPeak = g;
    }
    if (ev.type === 'DEATH')      totalDeaths++;
    if (ev.type === 'STRUCTURE')  activeViolations++;
  }

  return { generationPeak, totalBirths, totalDeaths, activeViolations };
}

function _buildSummary(sentences, worldState) {
  if (sentences.length === 0) return 'A quiet tick passed without notable events.';

  const parts = [];

  if (worldState.totalBirths > 0) {
    parts.push(
      worldState.totalBirths === 1
        ? 'A new life entered the world.'
        : `${worldState.totalBirths} new lives entered the world.`
    );
  }
  if (worldState.totalDeaths > 0) {
    parts.push(
      worldState.totalDeaths === 1
        ? 'One life ended.'
        : `${worldState.totalDeaths} lives ended.`
    );
  }
  if (worldState.activeViolations > 0) {
    parts.push('Structural instability disturbed the causal fabric.');
  }
  if (worldState.generationPeak > 0) {
    parts.push(`Generation ${worldState.generationPeak} is present.`);
  }

  if (parts.length === 0) {
    const types = [...new Set(sentences.map(s => s.type))];
    return `Events of type ${types.join(', ')} occurred.`;
  }

  return parts.join(' ');
}

module.exports = { processEvents, SENTENCE_BUILDERS };

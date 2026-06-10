'use strict';

/**
 * Event Collector
 *
 * Reads a traceCollector snapshot (from tickManager) and lineageEngine state,
 * then emits a flat array of NarrativeEvent objects.
 *
 * Pure extraction — no mutation, no side effects.
 *
 * NarrativeEvent shape:
 * {
 *   tick:     number,
 *   type:     'BIRTH' | 'DEATH' | 'RELATIONSHIP' | 'STRUCTURE' | 'ECOLOGY',
 *   actors:   string[],
 *   data:     object,
 *   severity: number (0–1)
 * }
 */

/**
 * collectEvents(traceCollector, tick, lineageEngine?) → NarrativeEvent[]
 *
 * @param {object}  trace          — traceCollector.current (one tick snapshot)
 * @param {number}  tick
 * @param {object}  [lineageEngine] — optional for lineage-enriched events
 */
function collectEvents(trace, tick, lineageEngine) {
  if (!trace) return [];

  const events = [];

  // ── Births ────────────────────────────────────────────────────────────────
  const births = trace.birthSystem?.births ?? [];
  for (const newborn of births) {
    const parentIds = Array.from(newborn.lineage?.parentIds ?? []);
    const generation = lineageEngine?.getRecord(newborn.id)?.generation ?? null;
    events.push(_event('BIRTH', tick, [newborn.id, ...parentIds], {
      childId:    newborn.id,
      parentIds,
      generation,
      birthTick:  newborn.lineage?.birthTick ?? tick
    }, 0.4));
  }

  // ── Deaths ────────────────────────────────────────────────────────────────
  const corpseEntries = trace.life?.corpseEntries ?? [];
  for (const corpse of corpseEntries) {
    const agentId = corpse.id ?? corpse.agentId ?? null;
    if (!agentId) continue;
    events.push(_event('DEATH', tick, [agentId], {
      agentId,
      causeOfDeath: corpse.causeOfDeath ?? 'unknown',
      ageTicks:     corpse.ageTicks ?? null
    }, 0.5));
  }

  // ── CI Structure violations ───────────────────────────────────────────────
  const ciReport = trace.architectureCI;
  if (ciReport?.violations?.length > 0) {
    for (const v of ciReport.violations) {
      const severity = _violationSeverity(v.type);
      events.push(_event('STRUCTURE', tick, _violationActors(v), {
        violationType: v.type,
        from:          v.from,
        to:            v.to,
        reason:        v.reason
      }, severity));
    }
  }

  // ── Reproduction proposals ────────────────────────────────────────────────
  const proposals = trace.reproductionEvents ?? [];
  for (const p of proposals) {
    if (!p.approved) continue;
    const actors = Array.isArray(p.participants) ? [...p.participants] : [];
    events.push(_event('RELATIONSHIP', tick, actors, {
      proposalType: 'MATING',
      probability:  p.probability ?? null
    }, 0.3));
  }

  // ── Ecology / World demand shifts ─────────────────────────────────────────
  const demand = trace.resourceFlow ?? trace.demandShift ?? null;
  if (demand?.pressureLevel > 0.7) {
    events.push(_event('ECOLOGY', tick, [], {
      pressureLevel: demand.pressureLevel,
      description:   'resource pressure elevated'
    }, demand.pressureLevel));
  }

  return events;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function _event(type, tick, actors, data, severity) {
  return Object.freeze({
    tick,
    type,
    actors:   Object.freeze([...actors].filter(Boolean)),
    data:     Object.freeze({ ...data }),
    severity: Math.min(1, Math.max(0, severity ?? 0))
  });
}

function _violationSeverity(type) {
  switch (type) {
    case 'CAUSAL_REVERSAL': return 0.9;
    case 'LAYER_DRIFT':     return 0.7;
    case 'HIGH_DRIFT':      return 0.8;
    case 'CYCLE':           return 1.0;
    case 'FORBIDDEN_EDGE':  return 0.85;
    case 'LAYER_BREAK':     return 0.75;
    default:                return 0.5;
  }
}

function _violationActors(v) {
  const a = [];
  if (v.from) a.push(v.from);
  if (v.to && v.to !== v.from) a.push(v.to);
  return a;
}

module.exports = { collectEvents };

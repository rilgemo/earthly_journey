'use strict';

/**
 * World Observation Engine v1
 *
 * Reads all live system outputs and produces a single, human-readable
 * world view per tick. This is the "upper interpreter" — it synthesises
 * everything already computed; it computes nothing new.
 *
 * Input context:
 * {
 *   tick,
 *   world,          — raw worldObj from tickManager
 *   agents,         — current npcs array
 *   trace,          — traceCollector.current (one tick snapshot)
 *   lineageEngine,  — worldObj.lineageEngine (optional)
 *   narrativeMemory — NarrativeMemory instance (optional)
 * }
 *
 * Output (WorldObservation):
 * {
 *   tick,
 *   worldState:     { elements, stability },
 *   population:     { total, alive, distribution },
 *   events:         string[],
 *   lineageSummary: { roots, deepestLine, generationCount },
 *   narrative:      string[],
 *   anomalies:      string[]
 * }
 */

/**
 * buildWorldObservation(context) → WorldObservation
 */
function buildWorldObservation(context) {
  const {
    tick,
    world          = {},
    agents         = [],
    trace          = {},
    lineageEngine  = null,
    narrativeMemory = null
  } = context ?? {};

  const agentIds = agents.map(a => a?.id).filter(Boolean);

  return Object.freeze({
    tick:           tick ?? null,
    worldState:     summarizeWorld(world),
    population:     buildPopulationView(agents),
    events:         compressEvents(trace, narrativeMemory),
    lineageSummary: buildLineageSummary(lineageEngine, agentIds),
    narrative:      buildNarrativeView(narrativeMemory, tick),
    anomalies:      detectAnomalies(world, agents, trace)
  });
}

// ─── sub-builders ─────────────────────────────────────────────────────────────

/**
 * summarizeWorld(world) → { elements, stability }
 */
function summarizeWorld(world) {
  if (!world) return { elements: {}, stability: 1 };

  const fields = world.fields ?? {};
  const elements = {};
  let totalDeviation = 0;
  let fieldCount = 0;

  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'number') {
      elements[key] = value;
      // Stability proxy: how far each field is from its midpoint (0.5)
      totalDeviation += Math.abs(value - 0.5);
      fieldCount++;
    }
  }

  const stability = fieldCount > 0
    ? Math.round((1 - totalDeviation / fieldCount) * 1000) / 1000
    : 1;

  return { elements, stability: Math.min(1, Math.max(0, stability)) };
}

/**
 * buildPopulationView(agents) → { total, alive, distribution }
 *
 * distribution: { juvenile, adult, elder, deceased }
 */
function buildPopulationView(agents) {
  if (!Array.isArray(agents) || agents.length === 0) {
    return { total: 0, alive: 0, distribution: {} };
  }

  const distribution = {};
  let alive = 0;

  for (const agent of agents) {
    const stage = agent?.life?.lifeStage ?? 'unknown';
    distribution[stage] = (distribution[stage] ?? 0) + 1;
    if (agent?.life?.alive !== false) alive++;
  }

  return { total: agents.length, alive, distribution };
}

/**
 * buildLineageSummary(lineageEngine, agentIds) →
 *   { roots, deepestLine, generationCount }
 *
 * roots:         gen-0 agent ids
 * deepestLine:   string representation of the longest ancestral chain
 * generationCount: number of distinct generations present
 */
function buildLineageSummary(lineageEngine, agentIds) {
  const empty = { roots: [], deepestLine: null, generationCount: 0 };
  if (!lineageEngine || !Array.isArray(agentIds) || agentIds.length === 0) return empty;

  const roots = agentIds.filter(id => {
    const rec = lineageEngine.getRecord(id);
    return rec && rec.parentIds.length === 0;
  });

  const dist = lineageEngine.getGenerationDistribution();
  const generationCount = Object.keys(dist).length;

  // Find the deepest descendant chain from any root
  let deepestLine = null;
  let maxDepth    = 0;

  for (const rootId of roots) {
    const chain = _longestChain(lineageEngine, rootId);
    if (chain.length > maxDepth) {
      maxDepth    = chain.length;
      deepestLine = chain.join(' → ');
    }
  }

  return { roots, deepestLine, generationCount };
}

/**
 * compressEvents(trace, narrativeMemory) → string[]
 *
 * Reduces raw trace data into ≤5 human-readable event statements.
 */
function compressEvents(trace, narrativeMemory) {
  const statements = [];
  if (!trace) return statements;

  // Births
  const births = trace.birthSystem?.births ?? [];
  if (births.length === 1) {
    statements.push(`${births[0].id} was born.`);
  } else if (births.length > 1) {
    statements.push(`${births.length} new agents were born.`);
  }

  // Deaths
  const deaths = trace.life?.corpseEntries ?? [];
  if (deaths.length === 1) {
    const id = deaths[0].id ?? deaths[0].agentId ?? 'an agent';
    statements.push(`${id} passed from the world.`);
  } else if (deaths.length > 1) {
    statements.push(`${deaths.length} agents died this tick.`);
  }

  // CI violations
  const violations = trace.architectureCI?.violations ?? [];
  const highViol   = violations.filter(v =>
    v.type === 'CAUSAL_REVERSAL' || v.type === 'CYCLE' || v.type === 'HIGH_DRIFT'
  );
  if (highViol.length > 0) {
    statements.push('Structural instability detected in the causal fabric.');
  } else if (violations.length > 0) {
    statements.push('Minor causal anomalies were observed.');
  }

  // Approved reproductions
  const proposals = (trace.reproductionEvents ?? []).filter(p => p.approved);
  if (proposals.length > 0) {
    statements.push(`${proposals.length} bond${proposals.length === 1 ? '' : 's'} formed.`);
  }

  // Recent narrative summary from memory
  if (narrativeMemory) {
    const recent = narrativeMemory.recent(1);
    if (recent.length > 0 && recent[0].summary) {
      statements.push(recent[0].summary);
    }
  }

  return statements;
}

/**
 * buildNarrativeView(narrativeMemory, tick) → string[]
 *
 * Returns the 3 most recent distinct narrative summaries.
 */
function buildNarrativeView(narrativeMemory, tick) {
  if (!narrativeMemory) return ['The world is observed in silence.'];

  const window = narrativeMemory.recent(5);
  const seen   = new Set();
  const lines  = [];

  for (const output of [...window].reverse()) {
    const s = output.summary;
    if (s && !seen.has(s)) {
      seen.add(s);
      lines.push(s);
      if (lines.length >= 3) break;
    }
  }

  if (lines.length === 0) {
    lines.push('The world holds still.');
  }

  return lines;
}

/**
 * detectAnomalies(world, agents, trace) → string[]
 *
 * Lightweight anomaly detection from observable state.
 */
function detectAnomalies(world, agents, trace) {
  const anomalies = [];

  // Extreme field values
  const fields = world?.fields ?? {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'number') {
      if (value >= 0.95) anomalies.push(`${key} field at critical high (${value.toFixed(2)}).`);
      if (value <= 0.05) anomalies.push(`${key} field at critical low (${value.toFixed(2)}).`);
    }
  }

  // Population crash
  const alive = Array.isArray(agents) ? agents.filter(a => a?.life?.alive !== false).length : 0;
  if (agents.length > 0 && alive === 0) {
    anomalies.push('All agents have died — population extinction event.');
  } else if (agents.length > 5 && alive / agents.length < 0.2) {
    anomalies.push('Population critically low — fewer than 20% of agents alive.');
  }

  // Hard CI violations
  const violations = trace?.architectureCI?.violations ?? [];
  const cycleViol  = violations.find(v => v.type === 'CYCLE');
  if (cycleViol) {
    anomalies.push(`Causal cycle detected: ${cycleViol.from} ↔ ${cycleViol.to}.`);
  }

  return anomalies;
}

// ─── private helpers ──────────────────────────────────────────────────────────

function _longestChain(lineageEngine, rootId) {
  // DFS to find the deepest descendant path
  let best = [rootId];

  function dfs(id, path) {
    const rec = lineageEngine.getRecord(id);
    if (!rec || rec.childrenIds.length === 0) {
      if (path.length > best.length) best = [...path];
      return;
    }
    for (const cid of rec.childrenIds) {
      dfs(cid, [...path, cid]);
    }
  }

  dfs(rootId, [rootId]);
  return best;
}

module.exports = {
  buildWorldObservation,
  summarizeWorld,
  buildPopulationView,
  buildLineageSummary,
  compressEvents,
  buildNarrativeView,
  detectAnomalies
};

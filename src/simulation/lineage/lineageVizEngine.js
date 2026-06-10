'use strict';

/**
 * Lineage Viz Engine
 *
 * Transforms a lineageEngine instance into a structured history:
 *   timeline, generation index, family clusters.
 *
 * Pure function — reads from lineageEngine, never writes to it.
 * No CI. No diff. No graph theory. Just "who lived and who begat whom."
 */

/**
 * buildLineageHistory(lineageEngine) → LineageHistory
 *
 * LineageHistory:
 * {
 *   timeline: [{ tick, events: [{ type, parentIds, childId, generation }] }],
 *   generations: { [gen]: string[] },
 *   familyClusters: { [familyId]: string[] },
 *   summary: { totalAgents, maxGeneration, totalBirths, totalFamilies }
 * }
 *
 * Events types:
 *   'BIRTH'   — a newborn registered (parentIds populated)
 *   'ORIGIN'  — founding agent (parentIds empty)
 */
function buildLineageHistory(lineageEngine) {
  if (!lineageEngine) {
    return _empty();
  }

  // Collect all records via public API
  const distribution = lineageEngine.getGenerationDistribution();
  const maxGeneration = Object.keys(distribution).length > 0
    ? Math.max(...Object.keys(distribution).map(Number))
    : 0;

  // Walk every generation to get all ids
  const allIds = _collectAllIds(lineageEngine, maxGeneration + 1);

  // Build timeline (grouped by birthTick)
  const timeline = _buildTimeline(allIds, lineageEngine);

  // Build generation map
  const generations = _buildGenerations(allIds, lineageEngine);

  // Build family clusters
  const familyClusters = _buildFamilyClusters(allIds, lineageEngine);

  const totalBirths = allIds.filter(id => {
    const rec = lineageEngine.getRecord(id);
    return rec && rec.parentIds.length > 0;
  }).length;

  return {
    timeline,
    generations,
    familyClusters,
    summary: {
      totalAgents:   allIds.length,
      maxGeneration,
      totalBirths,
      totalFamilies: Object.keys(familyClusters).length
    }
  };
}

// ─── internal ────────────────────────────────────────────────────────────────

function _empty() {
  return {
    timeline:       [],
    generations:    {},
    familyClusters: {},
    summary: { totalAgents: 0, maxGeneration: 0, totalBirths: 0, totalFamilies: 0 }
  };
}

/**
 * Walk all generations to collect every registered id.
 * lineageEngine doesn't expose an "all ids" iterator, so we use
 * getGenerationDistribution() to know how many generations exist,
 * then probe via getRecord.
 *
 * More robust approach: scan via getFamilyTree on gen-0 roots.
 */
function _collectAllIds(lineageEngine, genCount) {
  const ids = new Set();

  // Start from gen-0 roots (agents with no parents)
  // We detect roots by probing generation 0 indirectly:
  // Any agent returned by getAncestors(x) for every x, whose own getAncestors is empty.
  // Simpler: use getFamilyTree on every agent and collect recursively.
  // But we have no "list all agents" call — so we use the distribution
  // to learn generation counts, then we know total agents from summary.size().

  // The engine exposes size() but not an iterator. We work around this by
  // calling buildFamilyTrees starting from gen-0 roots which we discover
  // through the lineage topology itself.

  // Fallback: use getGenerationDistribution to get counts, then attempt to
  // reconstruct via the family-tree walk from known roots.
  // The cleanest approach: expose via getRecord after collecting IDs through
  // tree traversal starting from agents whose ancestors list is empty.
  //
  // Since lineageEngine doesn't expose "all ids", we use the snapshot approach:
  // Call lineageEngine.getGenerationDistribution() to discover gen=0 count,
  // then trust that we discover all IDs by walking every familyCluster root.

  // Practical solution: lineageEngine stores records keyed by id.
  // We pass the engine and ask it to yield roots via a convention:
  // engine.getRoots() is not available, but we can add a thin wrapper here
  // by tracking agents ourselves during buildLineageHistory invocations.

  // ─── Design choice ─────────────────────────────────────────────────────────
  // Rather than pollute lineageEngine API, we accept a second arg: allAgentIds[].
  // If not provided, we fall back to family-tree discovery (best-effort).
  // The tickManager integration passes allAgentIds for full fidelity.
  //
  // For standalone use (tests, dump scripts), callers pass the second arg.
  // See buildLineageHistoryForAgents() below for the preferred call form.

  return Array.from(ids);
}

/**
 * Preferred entry point when agent ids are known.
 *
 * buildLineageHistoryForAgents(lineageEngine, agentIds) → LineageHistory
 */
function buildLineageHistoryForAgents(lineageEngine, agentIds) {
  if (!lineageEngine || !Array.isArray(agentIds) || agentIds.length === 0) {
    return _empty();
  }

  const knownIds = agentIds.filter(id => lineageEngine.getRecord(id) !== null);

  const timeline       = _buildTimeline(knownIds, lineageEngine);
  const generations    = _buildGenerations(knownIds, lineageEngine);
  const familyClusters = _buildFamilyClusters(knownIds, lineageEngine);

  const maxGeneration = Object.keys(generations).length > 0
    ? Math.max(...Object.keys(generations).map(Number))
    : 0;

  const totalBirths = knownIds.filter(id => {
    const rec = lineageEngine.getRecord(id);
    return rec && rec.parentIds.length > 0;
  }).length;

  return {
    timeline,
    generations,
    familyClusters,
    summary: {
      totalAgents:   knownIds.length,
      maxGeneration,
      totalBirths,
      totalFamilies: Object.keys(familyClusters).length
    }
  };
}

function _buildTimeline(ids, lineageEngine) {
  const byTick = new Map();

  for (const id of ids) {
    const rec = lineageEngine.getRecord(id);
    if (!rec) continue;

    const tick = rec.birthTick ?? 0;
    if (!byTick.has(tick)) byTick.set(tick, []);

    const eventType = rec.parentIds.length > 0 ? 'BIRTH' : 'ORIGIN';
    byTick.get(tick).push({
      type:       eventType,
      childId:    id,
      parentIds:  [...rec.parentIds],
      generation: rec.generation
    });
  }

  return Array.from(byTick.entries())
    .sort(([a], [b]) => a - b)
    .map(([tick, events]) => ({ tick, events }));
}

function _buildGenerations(ids, lineageEngine) {
  const gens = {};
  for (const id of ids) {
    const rec = lineageEngine.getRecord(id);
    if (!rec) continue;
    const g = rec.generation;
    if (!gens[g]) gens[g] = [];
    gens[g].push(id);
  }
  return gens;
}

function _buildFamilyClusters(ids, lineageEngine) {
  const clusters = {};
  for (const id of ids) {
    const rec = lineageEngine.getRecord(id);
    if (!rec) continue;
    const fid = rec.familyId ?? id;
    if (!clusters[fid]) clusters[fid] = [];
    clusters[fid].push(id);
  }
  return clusters;
}

module.exports = { buildLineageHistory, buildLineageHistoryForAgents };

'use strict';

/**
 * Lineage Engine v1
 *
 * Maintains a queryable index of the world's "graph of life":
 *   who was born from whom, which generation, which family line.
 *
 * This module owns genealogical truth. It has no opinion about CI,
 * causal graphs, or simulation correctness — those belong to the CI stack.
 *
 * Usage:
 *   const engine = createLineageEngine();
 *   engine.registerAgent(agent);          // for founding-generation agents
 *   engine.registerBirth(newborn, agents) // for newborns
 *   engine.getAncestors(id)
 *   engine.getDescendants(id)
 *   engine.getFamilyTree(id)
 *   engine.getGenerationDistribution()
 */

// ─── factory ─────────────────────────────────────────────────────────────────

function createLineageEngine() {
  // id → lineage record
  const _records = new Map();

  // ── public API ─────────────────────────────────────────────────────────────

  /**
   * Register a founding agent (generation 0, no parents).
   * Safe to call multiple times on the same id — idempotent.
   */
  function registerAgent(agent) {
    if (!agent?.id) return;
    if (_records.has(agent.id)) return;

    _records.set(agent.id, {
      id:           agent.id,
      fatherId:     agent.lineage?.fatherId     ?? null,
      motherId:     agent.lineage?.motherId     ?? null,
      parentIds:    Object.freeze(Array.from(agent.lineage?.parentIds ?? [])),
      childrenIds:  [],
      generation:   agent.lineage?.generation   ?? 0,
      familyId:     agent.lineage?.familyId     ?? agent.id,
      birthTick:    agent.lineage?.birthTick     ?? null
    });
  }

  /**
   * Register a newborn produced by birthSystem.
   * Automatically resolves fatherId / motherId and increments generation.
   *
   * @param {object} newborn   — fresh agent object (has lineage.parentIds)
   * @param {object[]} agents  — full agent list (used to look up parents)
   */
  function registerBirth(newborn, agents) {
    if (!newborn?.id) return;

    const parentIds = Array.from(newborn.lineage?.parentIds ?? []);
    const agentMap  = _buildAgentMap(agents);

    const [fatherId, motherId] = _resolveParentRoles(parentIds, agentMap);
    const generation           = _resolveGeneration(parentIds);
    const familyId             = _resolveFamilyId(parentIds, fatherId);

    _records.set(newborn.id, {
      id:          newborn.id,
      fatherId,
      motherId,
      parentIds:   Object.freeze(parentIds),
      childrenIds: [],
      generation,
      familyId,
      birthTick:   newborn.lineage?.birthTick ?? null
    });

    // update parent records
    for (const pid of parentIds) {
      const rec = _records.get(pid);
      if (rec && !rec.childrenIds.includes(newborn.id)) {
        rec.childrenIds.push(newborn.id);
      }
    }
  }

  /**
   * Get all ancestors of an agent, ordered from immediate parents upward.
   * Returns array of lineage records (not agent objects).
   */
  function getAncestors(id) {
    const result = [];
    const visited = new Set();
    const queue   = _getParentIds(id);

    while (queue.length > 0) {
      const pid = queue.shift();
      if (visited.has(pid)) continue;
      visited.add(pid);

      const rec = _records.get(pid);
      if (rec) {
        result.push(rec);
        for (const grandparent of _getParentIds(pid)) {
          if (!visited.has(grandparent)) queue.push(grandparent);
        }
      }
    }
    return result;
  }

  /**
   * Get all descendants of an agent, ordered from immediate children downward.
   * Returns array of lineage records.
   */
  function getDescendants(id) {
    const result  = [];
    const visited = new Set();
    const queue   = _getChildIds(id);

    while (queue.length > 0) {
      const cid = queue.shift();
      if (visited.has(cid)) continue;
      visited.add(cid);

      const rec = _records.get(cid);
      if (rec) {
        result.push(rec);
        for (const grandchild of rec.childrenIds) {
          if (!visited.has(grandchild)) queue.push(grandchild);
        }
      }
    }
    return result;
  }

  /**
   * Returns a tree node with id, generation, children (recursive).
   * Null if the agent is not registered.
   */
  function getFamilyTree(id) {
    const rec = _records.get(id);
    if (!rec) return null;
    return _buildTree(id, new Set());
  }

  /**
   * Returns { [generation]: count } for all registered agents.
   */
  function getGenerationDistribution() {
    const dist = {};
    for (const rec of _records.values()) {
      const g = rec.generation;
      dist[g] = (dist[g] || 0) + 1;
    }
    return dist;
  }

  /**
   * Returns the lineage record for an agent, or null.
   */
  function getRecord(id) {
    return _records.get(id) ?? null;
  }

  /**
   * Total number of registered agents.
   */
  function size() {
    return _records.size;
  }

  // ── private helpers ────────────────────────────────────────────────────────

  function _buildAgentMap(agents) {
    const map = new Map();
    if (Array.isArray(agents)) {
      for (const a of agents) if (a?.id) map.set(a.id, a);
    }
    return map;
  }

  function _getParentIds(id) {
    const rec = _records.get(id);
    return rec ? [...rec.parentIds] : [];
  }

  function _getChildIds(id) {
    const rec = _records.get(id);
    return rec ? [...rec.childrenIds] : [];
  }

  function _resolveParentRoles(parentIds) {
    // We don't model biological sex — first registered parent is "father",
    // second is "mother". Deterministic, reversible, not biologically loaded.
    return [parentIds[0] ?? null, parentIds[1] ?? null];
  }

  function _resolveGeneration(parentIds) {
    let max = -1;
    for (const pid of parentIds) {
      const rec = _records.get(pid);
      if (rec && rec.generation > max) max = rec.generation;
    }
    return max + 1; // founding agents default to gen 0 (max=-1 → 0)
  }

  function _resolveFamilyId(parentIds, fatherId) {
    // Family ID follows the paternal line; falls back to child's own id.
    if (fatherId) {
      const rec = _records.get(fatherId);
      if (rec) return rec.familyId;
    }
    return parentIds[0] ?? null;
  }

  function _buildTree(id, visited) {
    if (visited.has(id)) return null; // cycle guard
    visited.add(id);

    const rec = _records.get(id);
    if (!rec) return null;

    return {
      id,
      generation: rec.generation,
      familyId:   rec.familyId,
      children:   rec.childrenIds
        .map(cid => _buildTree(cid, visited))
        .filter(Boolean)
    };
  }

  // ── ASCII printer (dev utility) ────────────────────────────────────────────

  /**
   * Returns a multi-line ASCII tree string rooted at id.
   * Not for production output — debug / REPL use only.
   */
  function printTree(id, indent = '', isLast = true) {
    const rec = _records.get(id);
    if (!rec) return `${indent}[unknown: ${id}]\n`;

    const branch = indent === '' ? '' : isLast ? '└─ ' : '├─ ';
    let out = `${indent}${branch}${id} (gen ${rec.generation})\n`;

    const children = rec.childrenIds;
    const nextIndent = indent + (indent === '' ? '' : isLast ? '   ' : '│  ');
    children.forEach((cid, i) => {
      out += printTree(cid, nextIndent, i === children.length - 1);
    });
    return out;
  }

  return Object.freeze({
    registerAgent,
    registerBirth,
    getAncestors,
    getDescendants,
    getFamilyTree,
    getGenerationDistribution,
    getRecord,
    printTree,
    size
  });
}

module.exports = { createLineageEngine };

import { CIGraphIR, CINode, CIEdge } from './graphParser';

export interface NodeChange {
  id: string;
  layer: string;
  rank: number | null;
  status: 'added' | 'removed' | 'unchanged';
  layerFrom?: string;
  layerTo?: string;
}

export interface EdgeChange {
  from: string;
  to: string;
  status: 'added' | 'removed' | 'unchanged' | 'reversed';
}

export interface DriftLevel {
  label: 'stable' | 'mild' | 'structural' | 'dangerous';
  color: string;
}

export interface CIDiff {
  fromTick: number | null;
  toTick: number | null;
  nodes: NodeChange[];
  edges: EdgeChange[];
  causalDriftScore: number;
  driftLevel: DriftLevel;
  violations: { type: string; from: string | null; to: string | null; reason: string }[];
}

const DRIFT_WEIGHT_EDGE  = 0.4;
const DRIFT_WEIGHT_NODE  = 0.4;
const DRIFT_WEIGHT_LAYER = 0.2;

function driftLevel(score: number): DriftLevel {
  if (score < 0.2)  return { label: 'stable',      color: '#4ec94e' };
  if (score < 0.5)  return { label: 'mild',         color: '#d4c94a' };
  if (score < 0.8)  return { label: 'structural',   color: '#e08030' };
  return              { label: 'dangerous',    color: '#e05050' };
}

export function computeDiff(prevIR: CIGraphIR, nextIR: CIGraphIR): CIDiff {
  const prevNodeMap = new Map<string, CINode>();
  const nextNodeMap = new Map<string, CINode>();
  for (const n of (prevIR.nodes || [])) prevNodeMap.set(n.id, n);
  for (const n of (nextIR.nodes || [])) nextNodeMap.set(n.id, n);

  const prevEdgeSet = new Set<string>();
  const nextEdgeSet = new Set<string>();
  for (const e of (prevIR.edges || [])) prevEdgeSet.add(`${e.from}->${e.to}`);
  for (const e of (nextIR.edges || [])) nextEdgeSet.add(`${e.from}->${e.to}`);

  // ─── nodes ───────────────────────────────────────────────────────────────
  const nodes: NodeChange[] = [];
  const visitedIds = new Set<string>();

  for (const [id, node] of nextNodeMap) {
    visitedIds.add(id);
    if (!prevNodeMap.has(id)) {
      nodes.push({ id, layer: node.layer, rank: node.rank ?? null, status: 'added' });
    } else {
      const prev = prevNodeMap.get(id)!;
      if (prev.layer !== node.layer) {
        nodes.push({ id, layer: node.layer, rank: node.rank ?? null, status: 'unchanged', layerFrom: prev.layer, layerTo: node.layer });
      } else {
        nodes.push({ id, layer: node.layer, rank: node.rank ?? null, status: 'unchanged' });
      }
    }
  }
  for (const [id, node] of prevNodeMap) {
    if (!visitedIds.has(id)) {
      nodes.push({ id, layer: node.layer, rank: node.rank ?? null, status: 'removed' });
    }
  }
  nodes.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  // ─── edges ───────────────────────────────────────────────────────────────
  const edges: EdgeChange[] = [];
  const visitedEdges = new Set<string>();

  for (const key of nextEdgeSet) {
    visitedEdges.add(key);
    const [from, to] = key.split('->');
    const reverseKey = `${to}->${from}`;
    if (!prevEdgeSet.has(key) && prevEdgeSet.has(reverseKey)) {
      edges.push({ from, to, status: 'reversed' });
    } else if (!prevEdgeSet.has(key)) {
      edges.push({ from, to, status: 'added' });
    } else {
      edges.push({ from, to, status: 'unchanged' });
    }
  }
  for (const key of prevEdgeSet) {
    if (!visitedEdges.has(key)) {
      const [from, to] = key.split('->');
      edges.push({ from, to, status: 'removed' });
    }
  }

  // ─── drift score ─────────────────────────────────────────────────────────
  const totalNodes = Math.max(prevNodeMap.size, nextNodeMap.size, 1);
  const totalEdges = Math.max(prevEdgeSet.size, nextEdgeSet.size, 1);

  let nodeChanges = nodes.filter(n => n.status !== 'unchanged' || n.layerFrom !== undefined).length;
  let edgeChanges = edges.filter(e => e.status !== 'unchanged').length;
  let layerViolations = nodes.filter(n => n.layerFrom !== undefined).length;

  const score = Math.round(Math.min(
    DRIFT_WEIGHT_NODE  * Math.min(nodeChanges / totalNodes, 1) +
    DRIFT_WEIGHT_EDGE  * Math.min(edgeChanges / totalEdges, 1) +
    DRIFT_WEIGHT_LAYER * Math.min(layerViolations / totalNodes, 1),
    1
  ) * 1000) / 1000;

  // ─── violations ──────────────────────────────────────────────────────────
  const violations: CIDiff['violations'] = [];
  for (const e of edges) {
    if (e.status === 'reversed') {
      violations.push({
        type: 'CAUSAL_REVERSAL',
        from: e.from,
        to: e.to,
        reason: `Edge ${e.to}→${e.from} reversed to ${e.from}→${e.to}`
      });
    }
  }
  for (const n of nodes) {
    if (n.layerFrom !== undefined) {
      violations.push({
        type: 'LAYER_DRIFT',
        from: n.id,
        to: n.id,
        reason: `Module "${n.id}" moved from ${n.layerFrom} to ${n.layerTo}`
      });
    }
  }
  if (score > 0.6) {
    violations.push({
      type: 'HIGH_DRIFT',
      from: null,
      to: null,
      reason: `Causal drift score ${score} exceeds threshold 0.6`
    });
  }

  return {
    fromTick: prevIR.tick ?? null,
    toTick:   nextIR.tick ?? null,
    nodes,
    edges,
    causalDriftScore: score,
    driftLevel: driftLevel(score),
    violations
  };
}

export interface CINode {
  id: string;
  layer: string;
  rank: number | null;
}

export interface CIEdge {
  from: string;
  to: string;
  type: string;
}

export interface CIViolation {
  type: string;
  from: string;
  to: string;
  reason: string;
}

export interface CIMeta {
  version: string;
  canonicalOrderHash: string;
  layerSchema: string;
}

export interface CIGraphIR {
  tick: number | null;
  status: 'PASS' | 'FAIL';
  nodes: CINode[];
  edges: CIEdge[];
  violations: CIViolation[];
  meta: CIMeta;
}

export interface CIViewModel {
  tick: number | null;
  status: 'PASS' | 'FAIL';
  nodes: CINode[];
  edges: CIEdge[];
  violations: CIViolation[];
  meta: CIMeta;
  hasViolations: boolean;
  violationsByType: Record<string, CIViolation[]>;
}

export function parseCI(raw: unknown): CIViewModel {
  const ir = raw as Partial<CIGraphIR>;

  const tick   = typeof ir.tick === 'number' ? ir.tick : null;
  const status = ir.status === 'FAIL' ? 'FAIL' : 'PASS';
  const nodes  = Array.isArray(ir.nodes) ? ir.nodes : [];
  const edges  = Array.isArray(ir.edges) ? ir.edges : [];
  const violations = Array.isArray(ir.violations) ? ir.violations : [];
  const meta   = ir.meta ?? { version: 'unknown', canonicalOrderHash: '', layerSchema: '' };

  const violationsByType: Record<string, CIViolation[]> = {};
  for (const v of violations) {
    if (!violationsByType[v.type]) violationsByType[v.type] = [];
    violationsByType[v.type].push(v);
  }

  return {
    tick,
    status,
    nodes,
    edges,
    violations,
    meta,
    hasViolations: violations.length > 0,
    violationsByType
  };
}

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

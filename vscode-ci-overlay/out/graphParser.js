"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCI = parseCI;
function parseCI(raw) {
    const ir = raw;
    const tick = typeof ir.tick === 'number' ? ir.tick : null;
    const status = ir.status === 'FAIL' ? 'FAIL' : 'PASS';
    const nodes = Array.isArray(ir.nodes) ? ir.nodes : [];
    const edges = Array.isArray(ir.edges) ? ir.edges : [];
    const violations = Array.isArray(ir.violations) ? ir.violations : [];
    const meta = ir.meta ?? { version: 'unknown', canonicalOrderHash: '', layerSchema: '' };
    const violationsByType = {};
    for (const v of violations) {
        if (!violationsByType[v.type])
            violationsByType[v.type] = [];
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
//# sourceMappingURL=graphParser.js.map
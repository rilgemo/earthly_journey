'use strict';

/**
 * CI Pipeline Runner
 *
 * Owns the full CI pipeline from trace → artifact-ready result.
 * tickManager calls this once per tick and receives a plain value object
 * with no side effects.
 *
 * Pipeline:
 *   trace → ciReport (ciLiteRunner)
 *        → IR       (ciGraphIR)
 *        → diff     (ciGraphDiffEngine, only when prevIR is provided)
 *        → { ir, diff, violations }
 *
 * tickManager responsibility after this call:
 *   1. forward { ir, diff } to ciGraphWriter (when CI_GRAPH_WRITE)
 *   2. store ir as prevIR for the next tick
 *   3. attach ciReport / IR to traceCollector if needed
 */

const { runCILite }        = require('./ciLiteRunner');
const { generateCIGraphIR } = require('./ciGraphIR');
const { compareGraphs }     = require('./ciGraphDiffEngine');

/**
 * runCIPipeline(trace, prevIR?) → CIPipelineResult
 *
 * CIPipelineResult:
 * {
 *   ciReport  — raw output from ciLiteRunner
 *   ir        — standard CI Graph IR (ciGraphIR.js)
 *   diff      — webview-ready diff object, or null if no prevIR
 * }
 */
function runCIPipeline(trace, prevIR) {
  const ciReport  = runCILite(trace);
  const ir        = generateCIGraphIR(ciReport);
  const diff      = prevIR ? _buildWebviewDiff(prevIR, ir) : null;

  return Object.freeze({ ciReport, ir, diff });
}

// ─── internal ────────────────────────────────────────────────────────────────

function _buildWebviewDiff(prevIR, nextIR) {
  try {
    const result = compareGraphs(prevIR, nextIR);
    return {
      nodes: {
        added:        result.nodeDiff.added.map(n => n.id),
        removed:      result.nodeDiff.removed.map(n => n.id),
        layerChanged: result.nodeDiff.layerChanged
      },
      edges: {
        added:    result.edgeDiff.added,
        removed:  result.edgeDiff.removed,
        reversed: result.edgeDiff.reversed.map(r => {
          const [from, to] = r.now.split('->');
          return { from, to };
        })
      },
      causalDriftScore: result.causalDriftScore,
      violations:       result.violations
    };
  } catch (_) {
    return null;
  }
}

module.exports = { runCIPipeline };

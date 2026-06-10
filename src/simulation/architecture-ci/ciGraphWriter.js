//
// CI Graph Writer — PURE IO ONLY
//
// Receives a fully-constructed artifact object and writes it to disk.
// No graph logic. No diff computation. No reading of previous state.
//
// Diff must be computed upstream (tickManager) and passed in as a pre-built
// field on the artifact. This module never "understands" the graph.
//
// Called only when EARTHLY_CI_GRAPH=true — zero cost in normal runs.
//

'use strict';

const fs   = require('fs');
const path = require('path');

const GRAPH_DIR   = path.resolve(__dirname, '../../../docs/ci/graph');
const LATEST_PATH = path.join(GRAPH_DIR, 'latest.json');

function ensureDir() {
  if (!fs.existsSync(GRAPH_DIR)) {
    fs.mkdirSync(GRAPH_DIR, { recursive: true });
  }
}

/**
 * writeCIGraphArtifact(ciGraphIR, diff?)
 *
 * ciGraphIR — standard CI Graph IR (from ciGraphIR.js)
 * diff      — optional pre-computed webview diff object (from tickManager via ciGraphDiffEngine)
 *
 * Writes:
 *   latest.json       — IR + optional diff (live view state, ignored by git)
 *   tick_XXXXXX.json  — clean IR only (immutable history, tracked by git)
 */
function writeCIGraphArtifact(ciGraphIR, diff) {
  try {
    ensureDir();

    const artifact = diff != null ? { ...ciGraphIR, diff } : ciGraphIR;
    fs.writeFileSync(LATEST_PATH, JSON.stringify(artifact, null, 2), 'utf-8');

    if (typeof ciGraphIR.tick === 'number') {
      const tickPath = path.join(GRAPH_DIR, `tick_${String(ciGraphIR.tick).padStart(6, '0')}.json`);
      fs.writeFileSync(tickPath, JSON.stringify(ciGraphIR, null, 2), 'utf-8');
    }
  } catch (_) {
    // Writer must never crash the simulation
  }
}

module.exports = { writeCIGraphArtifact };

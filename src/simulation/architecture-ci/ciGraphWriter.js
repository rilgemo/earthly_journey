//
// CI Graph Writer
//
// Writes the CI Graph IR artifact to docs/ci/graph/latest.json (and a
// tick-stamped copy) so the VSCode overlay watcher can detect changes.
//
// Called only when EARTHLY_CI_GRAPH=true — zero cost in normal simulation runs.
// Never imported by core simulation modules; only tickManager calls it.
//

const fs = require('fs');
const path = require('path');

const GRAPH_DIR = path.resolve(__dirname, '../../../docs/ci/graph');
const LATEST_PATH = path.join(GRAPH_DIR, 'latest.json');

function ensureDir() {
  if (!fs.existsSync(GRAPH_DIR)) {
    fs.mkdirSync(GRAPH_DIR, { recursive: true });
  }
}

function writeCIGraphArtifact(ciGraphIR) {
  try {
    ensureDir();
    const json = JSON.stringify(ciGraphIR, null, 2);
    fs.writeFileSync(LATEST_PATH, json, 'utf-8');

    if (typeof ciGraphIR.tick === 'number') {
      const tickPath = path.join(GRAPH_DIR, `tick_${String(ciGraphIR.tick).padStart(6, '0')}.json`);
      fs.writeFileSync(tickPath, json, 'utf-8');
    }
  } catch (_) {
    // Writer must never crash the simulation
  }
}

module.exports = { writeCIGraphArtifact };

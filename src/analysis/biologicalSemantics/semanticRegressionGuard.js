const fs = require('fs');
const path = require('path');

const SCALAR_SURVIVAL_TERMS = Object.freeze([
  /\bhp\b/i,
  /\bmaxhp\b/i,
  /\bhealthpoints?\b/i,
  /\bvitality\b/i
]);

const FORBIDDEN_BIOLOGY_KEYS = Object.freeze([
  'score',
  'total',
  'ratio',
  'percentage',
  'percent',
  'current',
  'maximum',
  'max'
]);

const FORBIDDEN_BIOLOGY_KEY_PATTERNS = Object.freeze([
  /score$/i,
  /total$/i,
  /ratio$/i,
  /percent(?:age)?$/i,
  /maximum$/i,
  /^max$/i,
  /^current$/i
]);

const FORBIDDEN_SIMULATION_IMPORTS = Object.freeze([
  /require\(['"].*(?:components|inspector|App)['"]\)/,
  /from\s+['"].*(?:components|inspector|App)['"]/
]);

function walkFiles(rootDir, extensions = ['.js', '.jsx', '.json']) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(rootDir, entry.name);
    if (entry.isDirectory()) return walkFiles(target, extensions);
    return extensions.includes(path.extname(entry.name)) ? [target] : [];
  });
}

function scanFile(filePath, patterns, type) {
  const source = fs.readFileSync(filePath, 'utf8');
  return source.split(/\r?\n/).flatMap((line, index) => (
    patterns.some(pattern => pattern.test(line))
      ? [{ type, file: filePath, line: index + 1, source: line.trim() }]
      : []
  ));
}

function scanSimulationSemantics(projectRoot) {
  const simulationRoot = path.join(projectRoot, 'src', 'simulation');
  const files = walkFiles(simulationRoot);
  return Object.freeze({
    scalarSurvivalTerms: Object.freeze(files.flatMap(file => (
      scanFile(file, SCALAR_SURVIVAL_TERMS, 'scalar-survival-term')
    ))),
    presentationImports: Object.freeze(files.flatMap(file => (
      scanFile(file, FORBIDDEN_SIMULATION_IMPORTS, 'presentation-import')
    )))
  });
}

function inspectBiologyShape(biology = {}) {
  const violations = [];

  function inspect(value, trail) {
    if (!value || typeof value !== 'object') return;
    Object.entries(value).forEach(([key, nested]) => {
      const nextTrail = [...trail, key];
      if (
        FORBIDDEN_BIOLOGY_KEYS.includes(key.toLowerCase())
        || FORBIDDEN_BIOLOGY_KEY_PATTERNS.some(pattern => pattern.test(key))
      ) {
        violations.push({
          type: 'aggregated-biology-key',
          path: nextTrail.join('.')
        });
      }
      inspect(nested, nextTrail);
    });
  }

  inspect(biology, ['biology']);
  return Object.freeze(violations);
}

module.exports = {
  FORBIDDEN_BIOLOGY_KEYS,
  FORBIDDEN_BIOLOGY_KEY_PATTERNS,
  FORBIDDEN_SIMULATION_IMPORTS,
  SCALAR_SURVIVAL_TERMS,
  inspectBiologyShape,
  scanSimulationSemantics,
  walkFiles
};

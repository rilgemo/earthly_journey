const fs = require('fs');
const path = require('path');
const {
  FORBIDDEN_SIMULATION_IMPORTS,
  SCALAR_SURVIVAL_TERMS,
  walkFiles
} = require('./semanticRegressionGuard');

const AGGREGATE_BIOLOGY_TERMS = Object.freeze([
  /\b(?:survival|biology|condition|capacity)(?:Score|Total|Ratio|Percent|Percentage|Value)\b/i,
  /\boverall (?:health|condition|capacity|survivability)\b/i,
  /\baggregate(?:d)? (?:health|condition|capacity|survivability)\b/i
]);

const CAPACITY_MAX_ANALOGUES = Object.freeze([
  /\bmax(?:imum)?[-_\s]?(?:health|survival|condition|capacity)\b/i,
  /\bcapacity\s*(?:=|as|means?)\s*(?:max|maximum)\b/i
]);

const AI_DEBUG_COMPRESSION_TERMS = Object.freeze([
  /\bsummar(?:y|ize|ise).*(?:condition|capacity).*(?:score|value|rating|percent)/i,
  /\b(?:condition|capacity).*(?:single|scalar|overall).*(?:score|value|rating|percent)/i,
  /\bcompress.*(?:condition|capacity).*(?:score|value|rating|percent)/i
]);

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function classifyScope(filePath, projectRoot) {
  const relative = normalizePath(path.relative(projectRoot, filePath));
  if (relative.startsWith('src/simulation/')) return 'critical';
  if (relative.startsWith('AI/')) return 'authority-risk';
  if (relative.startsWith('src/inspector/') || relative.includes('/debug')) return 'compression-risk';
  if (
    relative.startsWith('docs/architecture/HP_')
    || relative.includes('_AUDIT_')
    || relative === 'docs/architecture/STATE_AUTHORITY_MODEL_V1.md'
  ) return 'historical';
  if (
    relative.startsWith('docs/architecture/BIOLOGICAL_SEMANTIC_')
    || relative.startsWith('docs/architecture/CONTINUOUS_BIOLOGICAL_')
  ) return 'observation';
  if (relative.startsWith('docs/')) return 'authority-risk';
  return 'observation';
}

function createFinding(type, scope, file, line, source) {
  return Object.freeze({ type, scope, file, line, source });
}

function analyzeSources(entries = []) {
  const findings = [];

  entries.forEach(entry => {
    const scope = entry.scope || 'observation';
    String(entry.source || '').split(/\r?\n/).forEach((line, index) => {
      const candidates = [
        ['scalar-survival-model', SCALAR_SURVIVAL_TERMS],
        ['aggregated-biological-score', AGGREGATE_BIOLOGY_TERMS],
        ['capacity-max-analogue', CAPACITY_MAX_ANALOGUES],
        ['ai-debug-semantic-compression', AI_DEBUG_COMPRESSION_TERMS]
      ];

      candidates.forEach(([type, patterns]) => {
        if (patterns.some(pattern => pattern.test(line))) {
          findings.push(createFinding(type, scope, entry.file || 'unknown', index + 1, line.trim()));
        }
      });

      if (scope === 'critical' && FORBIDDEN_SIMULATION_IMPORTS.some(pattern => pattern.test(line))) {
        findings.push(createFinding(
          'ui-derived-simulation-shortcut',
          scope,
          entry.file || 'unknown',
          index + 1,
          line.trim()
        ));
      }
    });
  });

  return Object.freeze(findings.sort((a, b) => (
    a.file.localeCompare(b.file)
    || a.line - b.line
    || a.type.localeCompare(b.type)
  )));
}

function collectProjectSources(projectRoot) {
  const roots = [
    path.join(projectRoot, 'src', 'simulation'),
    path.join(projectRoot, 'src', 'inspector'),
    path.join(projectRoot, 'AI'),
    path.join(projectRoot, 'docs')
  ];

  return Object.freeze(roots.flatMap(root => (
    walkFiles(root, ['.js', '.jsx', '.json', '.md']).map(file => Object.freeze({
      file: normalizePath(path.relative(projectRoot, file)),
      scope: classifyScope(file, projectRoot),
      source: fs.readFileSync(file, 'utf8')
    }))
  )));
}

function buildContinuousDriftReport(projectRoot, options = {}) {
  const findings = analyzeSources(options.sources || collectProjectSources(projectRoot));
  const activeFindings = findings.filter(finding => (
    finding.scope !== 'historical' && finding.scope !== 'observation'
  ));
  const countsByType = Object.freeze(Object.fromEntries(
    [...new Set(findings.map(finding => finding.type))].sort().map(type => [
      type,
      findings.filter(finding => finding.type === type).length
    ])
  ));

  return Object.freeze({
    timestamp: options.timestamp || '1970-01-01T00:00:00.000Z',
    activeDriftCount: activeFindings.length,
    historicalReferenceCount: findings.filter(finding => finding.scope === 'historical').length,
    observationReferenceCount: findings.filter(finding => finding.scope === 'observation').length,
    countsByType,
    activeFindings: Object.freeze(activeFindings),
    historicalFindings: Object.freeze(findings.filter(finding => finding.scope === 'historical')),
    semanticIntegrity: activeFindings.length === 0 ? 'stable' : 'drift-detected'
  });
}

module.exports = {
  AGGREGATE_BIOLOGY_TERMS,
  AI_DEBUG_COMPRESSION_TERMS,
  CAPACITY_MAX_ANALOGUES,
  analyzeSources,
  buildContinuousDriftReport,
  classifyScope,
  collectProjectSources
};

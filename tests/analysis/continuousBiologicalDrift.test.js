const path = require('path');
const {
  analyzeSources,
  buildContinuousDriftReport
} = require('../../src/analysis/biologicalSemantics/continuousDriftDetector');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

describe('Continuous biological semantic drift detection', () => {
  test('detects scalar, aggregate, max-analogue, UI, and debug compression drift', () => {
    const findings = analyzeSources([
      { file: 'src/simulation/example.js', scope: 'critical', source: "const hp = 100;\nconst ui = require('../components/Panel');" },
      { file: 'AI/prompt.md', scope: 'authority-risk', source: 'capacity = maximum health' },
      { file: 'src/inspector/debug.js', scope: 'compression-risk', source: 'summarize condition into a score' },
      { file: 'docs/spec.md', scope: 'authority-risk', source: 'overall condition' }
    ]);

    expect(findings.map(finding => finding.type)).toEqual(expect.arrayContaining([
      'scalar-survival-model',
      'ui-derived-simulation-shortcut',
      'capacity-max-analogue',
      'ai-debug-semantic-compression',
      'aggregated-biological-score'
    ]));
  });

  test('separates historical references from active semantic drift', () => {
    const report = buildContinuousDriftReport(PROJECT_ROOT, {
      sources: [
        { file: 'docs/architecture/HP_MIGRATION_AUDIT_V1.md', scope: 'historical', source: 'HP migration history' },
        { file: 'src/simulation/model.js', scope: 'critical', source: 'condition.structural' }
      ]
    });

    expect(report.activeDriftCount).toBe(0);
    expect(report.historicalReferenceCount).toBe(1);
    expect(report.semanticIntegrity).toBe('stable');
  });

  test('report is deterministic and frozen', () => {
    const options = {
      timestamp: '2026-06-09T00:00:00.000Z',
      sources: [{ file: 'src/simulation/model.js', scope: 'critical', source: 'condition.structural' }]
    };
    const first = buildContinuousDriftReport(PROJECT_ROOT, options);
    const second = buildContinuousDriftReport(PROJECT_ROOT, options);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.activeFindings)).toBe(true);
  });

  test('current project has no active semantic drift', () => {
    const report = buildContinuousDriftReport(PROJECT_ROOT);

    expect(report.activeFindings).toEqual([]);
    expect(report.semanticIntegrity).toBe('stable');
  });

  test('detector does not mutate supplied sources', () => {
    const sources = Object.freeze([
      Object.freeze({ file: 'src/simulation/model.js', scope: 'critical', source: 'condition.structural' })
    ]);
    const before = JSON.stringify(sources);

    analyzeSources(sources);
    buildContinuousDriftReport(PROJECT_ROOT, { sources });

    expect(JSON.stringify(sources)).toBe(before);
  });
});

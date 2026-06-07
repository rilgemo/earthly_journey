/**
 * Decision Inspector v1
 *
 * Goal: explain completed decisions without changing runtime behavior.
 */

const { createDecisionTrace } = require('../../src/simulation/decisionTrace');
const { inspectDecision, hasTraceIntegrity } = require('../../src/simulation/decisionInspector');
const { resolveIntent } = require('../../src/simulation/resolutionModel');

function createCandidates() {
  return [
    {
      intent: 'rest',
      category: 'rest',
      score: 15,
      components: { base: 5, needScore: 8, influenceScore: 2 },
      reasonTrace: ['base:5', 'need:8', 'influence:2']
    },
    {
      intent: 'cast_magic',
      category: 'magic',
      score: 42,
      components: { base: 10, roleScore: 12, influenceScore: 20 },
      reasonTrace: ['base:10', 'role:12', 'influence:20']
    }
  ];
}

function createTrace() {
  const candidates = createCandidates();
  const selected = resolveIntent(candidates);

  return createDecisionTrace({
    agentId: 'mage_1',
    tick: 7,
    candidates,
    influenceField: {
      profile: { cast_magic: 20, rest: 2 },
      sources: { role: { cast_magic: 12 }, world: { cast_magic: 8 } },
      topInfluences: [{ key: 'cast_magic', score: 20 }]
    },
    resolutionResult: selected
  });
}

describe('Decision Inspector v1', () => {
  test('candidate ranking is visible', () => {
    const inspection = inspectDecision(createTrace());

    expect(inspection.candidateRanking).toHaveLength(2);
    expect(inspection.candidateRanking[0].intent).toBe('cast_magic');
    expect(inspection.candidateRanking[1].intent).toBe('rest');
  });

  test('candidate breakdown is generated', () => {
    const inspection = inspectDecision(createTrace());

    expect(inspection.breakdown.cast_magic.base).toBe(10);
    expect(inspection.breakdown.cast_magic.roleScore).toBe(12);
    expect(inspection.breakdown.cast_magic.influenceScore).toBe(20);
    expect(inspection.influenceContributions.sources.role.cast_magic).toBe(12);
  });

  test('selected intent matches resolution result', () => {
    const inspection = inspectDecision(createTrace());

    expect(inspection.selected).toBe('cast_magic');
    expect(inspection.resolutionResult.selectedIntent).toBe('cast_magic');
    expect(inspection.resolutionResult.finalScore).toBe(42);
  });

  test('inspector cannot mutate runtime candidates or traces', () => {
    const candidates = createCandidates();
    const selected = resolveIntent(candidates);
    const trace = createDecisionTrace({
      agentId: 'mage_1',
      candidates,
      resolutionResult: selected
    });
    const inspection = inspectDecision(trace);

    expect(Object.isFrozen(trace)).toBe(true);
    expect(Object.isFrozen(trace.breakdown.cast_magic)).toBe(true);
    expect(Object.isFrozen(inspection)).toBe(true);
    expect(Object.isFrozen(inspection.candidateRanking)).toBe(true);

    expect(candidates[1].score).toBe(42);
    expect(selected.score).toBe(42);
  });

  test('decision trace integrity is maintained', () => {
    const trace = createTrace();

    expect(hasTraceIntegrity(trace)).toBe(true);
    expect(trace.selected).toBe(trace.resolutionResult.selectedIntent);
    expect(trace.candidates.some(candidate => candidate.intent === trace.selected)).toBe(true);
  });
});

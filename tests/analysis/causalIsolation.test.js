const { scoreIntents } = require('../../src/simulation/intent/intentScorer');
const { enrichIntents } = require('../../src/simulation/intent/intentEnricher');
const { resolveFinalIntent } = require('../../src/simulation/intent/intentResolver');
const intentPipeline = require('../../src/simulation/intent/intentPipeline');
const { validateIntentPhaseIsolation } = require('../../src/analysis/causalIsolation/phaseIsolationValidator');
const { buildCrossLayerInfluenceMatrix } = require('../../src/analysis/causalIsolation/crossLayerInfluenceMatrix');
const { verifyDeterministicReplay } = require('../../src/analysis/causalIsolation/deterministicReplayVerifier');
const { compareCausalTraces } = require('../../src/analysis/causalIsolation/causalTraceComparator');
const { scanLayerIntegrity } = require('../../src/analysis/causalIsolation/layerIntegrityScanner');
const { buildInfluenceGraph } = require('../../src/analysis/causalIsolation/influenceGraphBuilder');

function createAgent() {
  return {
    id: 'agent_1',
    type: 'animal',
    location: 'meadow',
    traits: {},
    skills: {},
    knowledge: [],
    needs: { hunger: 20, fatigue: 10, manaNeed: 0, socialNeed: 5, safetyNeed: 10 },
    affinities: { fire: 0, water: 0, earth: 0.2, arcane: 0 },
    mana: {
      capacity: 100,
      current: 10,
      stability: 0.5,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} }
  };
}

const ACTIONS = Object.freeze([
  Object.freeze({ id: 'rest', type: 'survival', baseUtility: 1, effects: {} }),
  Object.freeze({ id: 'hunt', type: 'combat', baseUtility: 2, effects: {} })
]);

function createContext(agent) {
  return {
    perception: { field: { fire: 0, water: 0, earth: 0.2, arcane: 0 }, nearbyAgents: [] },
    memories: agent.memory.shortTerm,
    needs: { profile: agent.needs, urgency: 1 },
    influenceProfile: { hunt: 1 },
    demandIndex: { food: 10 }
  };
}

describe('Causal Layer Isolation Framework v1', () => {
  test('Phase A is pure under identical inputs', () => {
    const agent = createAgent();
    const context = createContext(agent);
    const beforeSnapshot = JSON.stringify({ agent, actions: ACTIONS, context });
    const firstScoring = scoreIntents(agent, ACTIONS, context);
    const secondScoring = scoreIntents(agent, ACTIONS, context);
    const enrichmentResult = enrichIntents(firstScoring, ACTIONS);
    const resolutionResult = resolveFinalIntent(enrichmentResult.enrichedIntents, context);
    const afterSnapshot = JSON.stringify({ agent, actions: ACTIONS, context });
    const result = validateIntentPhaseIsolation({
      firstScoring,
      secondScoring,
      enrichmentResult,
      resolutionResult,
      beforeSnapshot,
      afterSnapshot,
    });

    expect(result.phaseA.valid).toBe(true);
    expect(result.phaseA.deterministic).toBe(true);
    expect(result.phaseA.mutationFree).toBe(true);
  });

  test('Phase A unaffected by all external systems not present in scoring input', () => {
    const agent = createAgent();
    const context = createContext(agent);
    const first = scoreIntents(agent, ACTIONS, context);
    const externalSystemNoise = { settlement: { hiddenState: 99 }, inspector: { selected: 'hunt' } };
    const second = scoreIntents(agent, ACTIONS, context);

    expect(externalSystemNoise.settlement.hiddenState).toBe(99);
    expect(first).toEqual(second);
  });

  test('Phase B does not alter Phase A output', () => {
    const scoring = scoreIntents(createAgent(), ACTIONS, createContext(createAgent()));
    const enriched = enrichIntents(scoring, ACTIONS);

    expect(enriched.enrichedIntents.map(intent => intent.score)).toEqual(
      scoring.intentScores.map(intent => intent.score)
    );
  });

  test('Phase C only selects from provided intents', () => {
    const scoring = scoreIntents(createAgent(), ACTIONS, createContext(createAgent()));
    const enriched = enrichIntents(scoring, ACTIONS);
    const resolved = resolveFinalIntent(enriched.enrichedIntents);

    expect(resolved.selectionSet).toContain(resolved.selectedIntentId);
  });

  test('replay produces identical Phase A hashes', () => {
    const agent = createAgent();
    const first = intentPipeline.execute(agent, ACTIONS, createContext(agent));
    const second = intentPipeline.execute(agent, ACTIONS, createContext(agent));
    const replay = verifyDeterministicReplay(first, second);

    expect(replay.valid).toBe(true);
    expect(replay.phaseAHashFirst).toBe(replay.phaseAHashSecond);
  });

  test('no hidden mutation detected in intent pipeline', () => {
    const agent = createAgent();
    const context = createContext(agent);
    const before = JSON.parse(JSON.stringify({ agent, actions: ACTIONS, context }));
    const result = intentPipeline.execute(agent, ACTIONS, context);
    const after = JSON.parse(JSON.stringify({ agent, actions: ACTIONS, context }));
    const scan = scanLayerIntegrity({
      before,
      after,
      scoringResult: result.scoringResult,
      enrichmentResult: result.enrichmentResult,
      resolutionResult: result.resolutionResult
    });

    expect(scan.valid).toBe(true);
    expect(scan.violations).toHaveLength(0);
  });

  test('influence graph matches declared dependencies', () => {
    const graph = buildInfluenceGraph({ agentId: 'agent_1', intents: [{ intent: 'rest' }] });

    expect(graph.nodes.some(node => node.id === 'Typology' && node.type === 'system')).toBe(true);
    expect(graph.nodes.some(node => node.id === 'Phase A' && node.type === 'phase')).toBe(true);
    expect(graph.edges).toContainEqual({ from: 'Typology', to: 'Phase A', relation: 'contributes_to' });
  });

  test('cross-layer influence matrix defaults to zero influence', () => {
    const matrix = buildCrossLayerInfluenceMatrix();

    expect(matrix['Phase A'].Field).toBe(0);
    expect(matrix['Phase B'].Demand).toBe(0);
    expect(matrix['Phase C'].Typology).toBe(0);
  });

  test('causal trace comparison is stable', () => {
    const first = intentPipeline.execute(createAgent(), ACTIONS, createContext(createAgent()));
    const second = intentPipeline.execute(createAgent(), ACTIONS, createContext(createAgent()));

    expect(compareCausalTraces(first.intentTrace.causalTrace, second.intentTrace.causalTrace).equal).toBe(true);
  });
});

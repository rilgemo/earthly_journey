const path = require('path');
const {
  inspectBiologyShape,
  scanSimulationSemantics
} = require('../../src/analysis/biologicalSemantics/semanticRegressionGuard');
const {
  CONDITION_DIMENSIONS,
  createConditionCapacity,
  resolveConditionSignals,
  supportsLife
} = require('../../src/simulation/life/conditionCapacityModel');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

describe('Biological semantic regression guard', () => {
  test('simulation contains no scalar survival terminology', () => {
    const report = scanSimulationSemantics(PROJECT_ROOT);
    expect(report.scalarSurvivalTerms).toEqual([]);
  });

  test('simulation does not import UI or inspector authority', () => {
    const report = scanSimulationSemantics(PROJECT_ROOT);
    expect(report.presentationImports).toEqual([]);
  });

  test('canonical biology exposes no aggregate or normalized fields', () => {
    expect(inspectBiologyShape(createConditionCapacity())).toEqual([]);
    const violations = inspectBiologyShape({
      condition: { structural: 'sound' },
      survivalScore: 10,
      percentage: 100
    });

    expect(violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'biology.survivalScore' }),
      expect.objectContaining({ path: 'biology.percentage' })
    ]));
  });

  test('capacity remains multidimensional and categorical', () => {
    const biology = createConditionCapacity();

    expect(Object.keys(biology.capacity)).toEqual(CONDITION_DIMENSIONS);
    expect(Object.values(biology.capacity).every(value => typeof value === 'string')).toBe(true);
    expect(new Set(Object.values(biology.capacity))).toEqual(new Set(['full']));
  });

  test('condition signals expose dimensions, never a normalized scalar', () => {
    const signals = resolveConditionSignals(createConditionCapacity({
      condition: { structural: 'impaired', neural: 'collapsed' }
    }));

    expect(signals).toEqual({
      collapsedDimensions: ['neural'],
      constrainedDimensions: [],
      stressedDimensions: ['structural', 'neural']
    });
    expect(inspectBiologyShape(signals)).toEqual([]);
  });

  test('single-dimensional collapse cannot become survival authority', () => {
    CONDITION_DIMENSIONS.forEach(dimension => {
      expect(supportsLife(createConditionCapacity({
        condition: { [dimension]: 'collapsed' }
      }))).toBe(true);
    });
  });
});

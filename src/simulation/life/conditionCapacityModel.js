const CONDITION_DIMENSIONS = Object.freeze([
  'structural',
  'metabolic',
  'immune',
  'neural'
]);

const CONDITION_STATES = Object.freeze([
  'sound',
  'strained',
  'impaired',
  'collapsed'
]);

const CAPACITY_STATES = Object.freeze([
  'full',
  'reduced',
  'minimal'
]);

function createDimensionMap(dimensions, value) {
  return Object.freeze(Object.fromEntries(dimensions.map(dimension => [dimension, value])));
}

function normalizeDimensionMap(source, allowedStates, fallback) {
  return Object.freeze(Object.fromEntries(CONDITION_DIMENSIONS.map(dimension => [
    dimension,
    allowedStates.includes(source?.[dimension]) ? source[dimension] : fallback
  ])));
}

function createConditionCapacity(existing = {}) {
  return Object.freeze({
    capacity: normalizeDimensionMap(existing.capacity, CAPACITY_STATES, 'full'),
    condition: normalizeDimensionMap(existing.condition, CONDITION_STATES, 'sound')
  });
}

function resolveConditionSignals(conditionCapacity = createConditionCapacity()) {
  const collapsedDimensions = CONDITION_DIMENSIONS
    .filter(dimension => conditionCapacity.condition[dimension] === 'collapsed');
  const constrainedDimensions = CONDITION_DIMENSIONS
    .filter(dimension => conditionCapacity.capacity[dimension] !== 'full');
  const stressedDimensions = CONDITION_DIMENSIONS
    .filter(dimension => ['strained', 'impaired', 'collapsed'].includes(conditionCapacity.condition[dimension]));

  return Object.freeze({
    collapsedDimensions: Object.freeze(collapsedDimensions),
    constrainedDimensions: Object.freeze(constrainedDimensions),
    stressedDimensions: Object.freeze(stressedDimensions)
  });
}

function supportsLife(conditionCapacity = createConditionCapacity()) {
  const { collapsedDimensions } = resolveConditionSignals(conditionCapacity);
  return collapsedDimensions.length < 2;
}

const DEFAULT_CONDITION_CAPACITY = Object.freeze({
  capacity: createDimensionMap(CONDITION_DIMENSIONS, 'full'),
  condition: createDimensionMap(CONDITION_DIMENSIONS, 'sound')
});

module.exports = {
  CAPACITY_STATES,
  CONDITION_DIMENSIONS,
  CONDITION_STATES,
  DEFAULT_CONDITION_CAPACITY,
  createConditionCapacity,
  resolveConditionSignals,
  supportsLife
};

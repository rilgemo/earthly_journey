const FIELD_TYPES = Object.freeze([
  'fire',
  'water',
  'air',
  'earth',
  'life',
  'arcane'
]);

function createFieldState(values = {}) {
  return FIELD_TYPES.reduce((state, field) => {
    const value = Number(values[field] || 0);
    state[field] = Number.isFinite(value) ? Math.max(0, value) : 0;
    return state;
  }, {});
}

function cloneFieldState(field) {
  return createFieldState(field);
}

function createFieldDelta(values = {}) {
  return FIELD_TYPES.reduce((delta, field) => {
    const value = Number(values[field] || 0);
    delta[field] = Number.isFinite(value) ? value : 0;
    return delta;
  }, {});
}

function addFieldDelta(field, delta = {}) {
  const next = cloneFieldState(field);

  FIELD_TYPES.forEach(fieldType => {
    const change = Number(delta[fieldType] || 0);
    if (Number.isFinite(change)) {
      next[fieldType] = Math.max(0, next[fieldType] + change);
    }
  });

  return next;
}

function snapshotAreas(areas) {
  const result = {};

  for (const [tileId, area] of areas.entries()) {
    result[tileId] = {
      field: cloneFieldState(area.field),
      baselineField: cloneFieldState(area.baselineField || area.field),
      neighbors: [...(area.neighbors || [])]
    };
  }

  return result;
}

function totalFieldEnergy(field) {
  return FIELD_TYPES.reduce((sum, fieldType) => sum + (field[fieldType] || 0), 0);
}

module.exports = {
  FIELD_TYPES,
  createFieldState,
  cloneFieldState,
  createFieldDelta,
  addFieldDelta,
  snapshotAreas,
  totalFieldEnergy
};

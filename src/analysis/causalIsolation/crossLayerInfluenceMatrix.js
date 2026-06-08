const SYSTEMS = Object.freeze(['Field', 'Demand', 'Typology', 'Memory', 'Settlement']);
const PHASES = Object.freeze(['Phase A', 'Phase B', 'Phase C']);

function buildCrossLayerInfluenceMatrix(overrides = {}) {
  const matrix = {};
  PHASES.forEach(phase => {
    matrix[phase] = {};
    SYSTEMS.forEach(system => {
      matrix[phase][system] = overrides?.[phase]?.[system] || 0;
    });
    Object.freeze(matrix[phase]);
  });

  return Object.freeze(matrix);
}

function findNonZeroInfluences(matrix = buildCrossLayerInfluenceMatrix()) {
  return Object.freeze(Object.entries(matrix).flatMap(([phase, systems]) => (
    Object.entries(systems)
      .filter(([, value]) => value !== 0)
      .map(([system, value]) => Object.freeze({ phase, system, value }))
  )));
}

module.exports = {
  SYSTEMS,
  PHASES,
  buildCrossLayerInfluenceMatrix,
  findNonZeroInfluences
};

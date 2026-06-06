const { createFieldDelta, createFieldState } = require('./elementalField/fieldState');

const createArea = (id, field = {}, options = {}) => {
  const initialField = createFieldState(field);
  return {
    id,
    field: initialField,
    baselineField: createFieldState(options.baselineField || initialField),
    neighbors: [...(options.neighbors || [])],
    recentEvents: []
  };
};

const world = {
  areas: new Map(),
  fieldPerturbationQueue: [],
  fieldDynamicsConfig: {},
  lastFieldDynamicsTrace: null,
  emergenceHistory: {},
  emergenceConfig: {},
  lastEmergenceTrace: null,
  stabilityGains: null,
  lastStabilityTrace: null,
  stabilityHistory: [],
  addArea(area) {
    this.areas.set(area.id, area);
  },
  getField(areaId) {
    const a = this.areas.get(areaId);
    return a ? a.field : createFieldState();
  },
  queueFieldPerturbation(request) {
    this.fieldPerturbationQueue.push({
      tileId: request.tileId,
      perturbation: createFieldDelta(request.perturbation)
    });
  },
  pushEvent(areaId, ev) {
    const a = this.areas.get(areaId);
    if (a) {
      a.recentEvents.push({ t: Date.now(), e: ev });
      if (a.recentEvents.length > 50) a.recentEvents.shift();
    }
  },
  getRecentEvents(areaId) {
    const a = this.areas.get(areaId);
    return a ? a.recentEvents.slice(-10) : [];
  }
};

module.exports = { createArea, world };

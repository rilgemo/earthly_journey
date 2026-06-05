const createArea = (id, field = {}) => {
  return {
    id,
    field: Object.assign({ fire: 0, water: 0, earth: 0, arcane: 0 }, field),
    recentEvents: []
  };
};

const world = {
  areas: new Map(),
  addArea(area) {
    this.areas.set(area.id, area);
  },
  getField(areaId) {
    const a = this.areas.get(areaId);
    return a ? a.field : { fire: 0, water: 0, earth: 0, arcane: 0 };
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

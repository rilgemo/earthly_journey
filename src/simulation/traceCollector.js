class TraceCollector {
  constructor(max = 200) {
    this.traces = [];
    this.max = max;
    this.current = null;
  }

  beginTick(tickId, world) {
    this.current = {
      tickId,
      timestamp: Date.now(),
      worldSnapshot: {
        field: {}
      },
      agents: []
    };
    // shallow copy of fields per area
    for (const [id, area] of world.areas.entries()) {
      this.current.worldSnapshot[id] = { field: Object.assign({}, area.field) };
    }
  }

  recordAgent(trace) {
    if (!this.current) return;
    this.current.agents.push(trace);
  }

  endTick() {
    if (!this.current) return null;
    this.traces.push(this.current);
    if (this.traces.length > this.max) this.traces.shift();
    const ret = this.current;
    this.current = null;
    return ret;
  }

  getLatest() {
    return this.traces[this.traces.length - 1] || null;
  }

  getAll() {
    return this.traces.slice();
  }
}

module.exports = { TraceCollector };

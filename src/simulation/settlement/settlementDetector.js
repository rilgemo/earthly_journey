const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { cloneSnapshot } = require('../replayBuffer');
const { calculateCenterPoint, calculateRadius, clusterTiles } = require('./settlementCluster');
const { calculateSettlementMetrics, clamp01 } = require('./settlementMetrics');
const { evolveSettlements } = require('./settlementGrowthModel');

function dominantActivities(entries, limit = 5) {
  const counts = entries.reduce((result, entry) => {
    result[entry.action] = (result[entry.action] || 0) + 1;
    return result;
  }, {});
  return Object.entries(counts)
    .map(([action, count]) => ({ action, count }))
    .sort((first, second) => second.count - first.count || first.action.localeCompare(second.action))
    .slice(0, limit);
}

function aggregateByTile(history) {
  return history.reduce((result, trace) => {
    (trace.agents || []).forEach(agent => {
      if (!agent.position || !agent.actionSelected) return;
      if (!result[agent.position]) result[agent.position] = [];
      result[agent.position].push({
        agentId: agent.agentId,
        action: agent.actionSelected,
        tick: trace.tickId,
        tileId: agent.position
      });
    });
    return result;
  }, {});
}

class SettlementDetector {
  constructor({
    windowSize = 20,
    activityThreshold = 4,
    persistenceTicks = 3,
    minAgents = 2,
    neighborDistance = 1
  } = {}) {
    this.config = { windowSize, activityThreshold, persistenceTicks, minAgents, neighborDistance };
    this.history = [];
    this.previousSettlements = [];
    this.snapshot = freezeSnapshot({
      tick: 0,
      settlements: [],
      clusterHeatmap: {},
      events: []
    });
  }

  recordTick(tickTrace) {
    if (!tickTrace) return this.snapshot;
    this.history.push(cloneSnapshot(tickTrace));
    while (this.history.length > this.config.windowSize) this.history.shift();
    this.snapshot = this.detect();
    return this.snapshot;
  }

  detect() {
    const tileEntries = aggregateByTile(this.history);
    const activeTiles = {};
    const heatmap = {};

    Object.entries(tileEntries).forEach(([tileId, entries]) => {
      const agentCount = new Set(entries.map(entry => entry.agentId)).size;
      const activeTicks = new Set(entries.map(entry => entry.tick)).size;
      heatmap[tileId] = clamp01(entries.length / Math.max(1, this.config.windowSize * 2));
      if (
        entries.length >= this.config.activityThreshold
        && activeTicks >= this.config.persistenceTicks
        && agentCount >= this.config.minAgents
      ) {
        activeTiles[tileId] = entries;
      }
    });

    const latestTrace = this.history[this.history.length - 1] || {};
    const demandIndex = latestTrace.demand?.index || {};
    const resourceMetrics = latestTrace.resourceGeography?.metrics || null;
    const detected = clusterTiles(activeTiles, this.config.neighborDistance).map((tiles, index) => {
      const entries = tiles.flatMap(tileId => activeTiles[tileId]);
      const centerPoint = calculateCenterPoint(tiles);
      const persistenceScore = clamp01(
        new Set(entries.map(entry => entry.tick)).size / this.config.windowSize
      );
      const metrics = calculateSettlementMetrics(entries, {
        windowSize: this.config.windowSize,
        persistenceTicks: this.config.persistenceTicks,
        demandIndex
      });
      const baseDensity = entries.length / Math.max(1, this.config.activityThreshold * tiles.length);
      const contextualDensity = baseDensity
        * (0.8 + (metrics.resourcePressure * 0.1) + (metrics.demandAlignment * 0.1));
      return {
        id: `settlement:${tiles.join('|')}`,
        centerPoint,
        radius: calculateRadius(tiles, centerPoint),
        tiles,
        densityScore: clamp01(contextualDensity),
        activityHeat: Object.fromEntries(tiles.map(tileId => [tileId, heatmap[tileId]])),
        persistenceScore,
        dominantActivities: dominantActivities(entries),
        activityCount: entries.length,
        agentCount: new Set(entries.map(entry => entry.agentId)).size,
        metrics,
        order: index
      };
    });

    const evolved = evolveSettlements(this.previousSettlements, detected);
    this.previousSettlements = cloneSnapshot(evolved.settlements);
    return freezeSnapshot({
      tick: this.history[this.history.length - 1]?.tickId || 0,
        settlements: evolved.settlements,
        clusterHeatmap: heatmap,
        resourceMetrics,
        events: evolved.events
    });
  }

  getSnapshot() {
    return freezeSnapshot(cloneSnapshot(this.snapshot));
  }

  loadTraceHistory(traces = []) {
    traces.forEach(trace => this.recordTick(trace));
    return this.getSnapshot();
  }

  loadReplayFrames(frames = []) {
    frames.forEach(frame => this.loadTraceHistory(frame.trace || []));
    return this.getSnapshot();
  }
}

module.exports = {
  SettlementDetector,
  aggregateByTile,
  dominantActivities
};

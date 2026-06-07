const { cloneSnapshot } = require('../replayBuffer');

function freezeSnapshot(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freezeSnapshot);
  return Object.freeze(value);
}

class BehaviorTraceRecorder {
  constructor(windowSize = 100) {
    this.windowSize = Math.max(1, windowSize);
    this.history = new Map();
  }

  record(entry) {
    if (!entry?.agentId || !entry?.action) return null;
    const agentHistory = this.history.get(entry.agentId) || [];
    const recorded = {
      agentId: entry.agentId,
      tick: entry.tick,
      action: entry.action,
      contextTags: [...(entry.contextTags || [])]
    };
    agentHistory.push(recorded);
    while (agentHistory.length > this.windowSize) agentHistory.shift();
    this.history.set(entry.agentId, agentHistory);
    return freezeSnapshot(cloneSnapshot(recorded));
  }

  recordAgentTrace(agentTrace, tick) {
    return this.record({
      agentId: agentTrace?.agentId,
      tick,
      action: agentTrace?.actionSelected,
      contextTags: [
        agentTrace?.position,
        agentTrace?.agentType,
        agentTrace?.actionRejected ? 'rejected' : 'executed'
      ].filter(Boolean)
    });
  }

  recordTickTrace(tickTrace) {
    return (tickTrace?.agents || [])
      .map(agentTrace => this.recordAgentTrace(agentTrace, tickTrace.tickId))
      .filter(Boolean);
  }

  getAgentHistory(agentId) {
    return freezeSnapshot(cloneSnapshot(this.history.get(agentId) || []));
  }

  getSnapshot() {
    return freezeSnapshot(Object.fromEntries(
      [...this.history.entries()].map(([agentId, history]) => [agentId, cloneSnapshot(history)])
    ));
  }

  loadTraceHistory(traces = []) {
    traces.forEach(trace => this.recordTickTrace(trace));
    return this.getSnapshot();
  }

  loadReplayFrames(frames = []) {
    frames.forEach(frame => this.loadTraceHistory(frame.trace || []));
    return this.getSnapshot();
  }
}

module.exports = {
  BehaviorTraceRecorder,
  freezeSnapshot
};

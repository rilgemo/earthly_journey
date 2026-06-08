function collectAgentEvents(traces = []) {
  return traces.flatMap(tick => (
    (tick.agents || []).map(agent => ({
      tick: tick.tickId ?? tick.tick ?? 0,
      agentId: agent.agentId,
      action: agent.actionSelected,
      position: agent.position,
      typeId: agent.agentTypologySnapshot?.typeId || agent.agentType || 'unknown'
    })).filter(event => event.action)
  ));
}

function detectCulturePatterns(traces = [], options = {}) {
  const minimumCount = options.minimumCount || 2;
  const events = collectAgentEvents(traces);
  const counts = events.reduce((result, event) => {
    result[event.action] = (result[event.action] || 0) + 1;
    return result;
  }, {});

  return Object.freeze(Object.entries(counts)
    .filter(([, count]) => count >= minimumCount)
    .map(([action, count]) => Object.freeze({
      action,
      count,
      frequency: count / Math.max(1, events.length)
    }))
    .sort((first, second) => second.count - first.count || first.action.localeCompare(second.action)));
}

module.exports = {
  collectAgentEvents,
  detectCulturePatterns
};

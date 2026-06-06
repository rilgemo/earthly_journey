function ensureMemory(agent) {
  if (!agent.memory) {
    agent.memory = {};
  }

  if (!Array.isArray(agent.memory.shortTerm)) {
    agent.memory.shortTerm = [];
  }

  if (!Array.isArray(agent.memory.longTerm)) {
    agent.memory.longTerm = [];
  }

  if (!Array.isArray(agent.memory.recentEvents)) {
    agent.memory.recentEvents = [];
  }

  if (!agent.memory.bias) {
    agent.memory.bias = {};
  }

  return agent.memory;
}

function recallMemories(agent, context = {}) {
  const memory = ensureMemory(agent);
  const memories = [...memory.shortTerm, ...memory.longTerm];
  const location = context.location || agent.location;

  return memories
    .filter(item => {
      if (!item || item.strength <= 0) return false;
      if (item.location && location && item.location !== location) return false;
      return true;
    })
    .sort((a, b) => (b.strength || 0) - (a.strength || 0));
}

function recordMemory(agent, entry, options = {}) {
  const memory = ensureMemory(agent);
  const target = options.longTerm ? memory.longTerm : memory.shortTerm;
  const maxEntries = options.maxEntries || 20;

  target.push({
    tick: 0,
    strength: 10,
    source: agent.id,
    sourceType: 'self',
    ...entry
  });

  while (target.length > maxEntries) {
    target.shift();
  }
}

function recordActionOutcome(agent, actionId, tick, reward = 8) {
  const memory = ensureMemory(agent);

  memory.recentEvents.push(`${tick}: did ${actionId}`);
  if (memory.recentEvents.length > 20) memory.recentEvents.shift();

  memory.bias[actionId] = (memory.bias[actionId] || 0) + 0.1;

  recordMemory(agent, {
    type: 'success',
    action: actionId,
    value: reward,
    strength: reward,
    tick,
    location: agent.location
  });
}

module.exports = {
  ensureMemory,
  recallMemories,
  recordMemory,
  recordActionOutcome
};

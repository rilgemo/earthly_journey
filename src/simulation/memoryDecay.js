const { ensureMemory } = require('./memorySystem');

function decayMemoryList(memories, decayRate) {
  return memories
    .map(memory => ({
      ...memory,
      strength: Math.max(0, (memory.strength || 0) - decayRate)
    }))
    .filter(memory => memory.strength > 0);
}

function decayAgentMemory(agent, decayRate = 1) {
  const memory = ensureMemory(agent);

  memory.shortTerm = decayMemoryList(memory.shortTerm, decayRate);
  memory.longTerm = decayMemoryList(memory.longTerm, decayRate * 0.25);

  return {
    shortTerm: memory.shortTerm.length,
    longTerm: memory.longTerm.length
  };
}

module.exports = {
  decayAgentMemory
};

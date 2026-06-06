function isHeardMemory(memory) {
  return memory?.sourceType === 'heard' || String(memory?.type || '').startsWith('heard_');
}

function createHeardMemory(memory, sourceId, strength, tick) {
  return {
    ...memory,
    type: memory.type?.startsWith('heard_') ? memory.type : `heard_${memory.type || 'information'}`,
    source: sourceId,
    sourceType: 'heard',
    originalSource: memory.originalSource || memory.source || sourceId,
    strength,
    tick
  };
}

function getShareableMemories(agent) {
  const memory = agent.memory || {};
  return [...(memory.shortTerm || []), ...(memory.longTerm || [])]
    .filter(item => item && item.strength > 0)
    .sort((a, b) => b.strength - a.strength);
}

module.exports = {
  isHeardMemory,
  createHeardMemory,
  getShareableMemories
};

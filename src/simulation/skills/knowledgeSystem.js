function ensureKnowledge(agent) {
  if (!Array.isArray(agent.knowledge)) agent.knowledge = [];
  return agent.knowledge;
}

function getKnowledgeForAction(agent, actionId) {
  return ensureKnowledge(agent).filter(entry => (
    entry.action === actionId || entry.actions?.includes(actionId)
  ));
}

function getKnowledgeLearningMultiplier(agent, actionId) {
  return 1 + Math.min(0.5, getKnowledgeForAction(agent, actionId).length * 0.1);
}

function learnKnowledge(agent, entry) {
  const knowledge = ensureKnowledge(agent);
  const key = entry.key || `${entry.action || 'general'}:${entry.topic || 'knowledge'}`;
  if (knowledge.some(item => item.key === key)) return null;

  const learned = {
    key,
    topic: entry.topic || key,
    action: entry.action,
    actions: entry.actions,
    source: entry.source || agent.id,
    sourceType: entry.sourceType || 'observed',
    tick: entry.tick || 0
  };
  knowledge.push(learned);
  return learned;
}

function learnKnowledgeFromMemories(agent) {
  const memories = [
    ...(agent.memory?.shortTerm || []),
    ...(agent.memory?.longTerm || [])
  ];

  return memories.flatMap(memory => {
    if (!String(memory.type || '').includes('knowledge')) return [];
    const learned = learnKnowledge(agent, {
      key: memory.knowledgeKey || `${memory.action || 'general'}:${memory.target || memory.type}`,
      topic: memory.target || memory.type,
      action: memory.action,
      source: memory.source,
      sourceType: memory.sourceType,
      tick: memory.tick
    });
    return learned ? [learned] : [];
  });
}

module.exports = {
  ensureKnowledge,
  getKnowledgeForAction,
  getKnowledgeLearningMultiplier,
  learnKnowledge,
  learnKnowledgeFromMemories
};

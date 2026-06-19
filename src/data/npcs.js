export const AGENTS = {
  lao_zhou: {
    id: "lao_zhou",
    name: "老周",
    skills: [
      { name: "锻造入门", level: 1 },
      { name: "钓鱼", level: 1 },
    ],
    xp: { 锻造入门: 0, 钓鱼: 0 },
    actionLog: [],  // [{ tick, activity }], capped at 168 (7 game-days × 24 ticks)
    schedule: [
      { from: 360, to: 1200, activity: "锻造", location: "新叶镇·锻造铺" },
      { from: 1200, to: 1260, activity: "用餐", location: "新叶镇·晨星旅店" },
      { from: 1260, to: 1320, activity: "锻造", location: "新叶镇·锻造铺" },
      { from: 1320, to: 1380, activity: "钓鱼", location: "南边林地" },
    ],
    defaultLocation: "新叶镇·广场",
    defaultActivity: "闲逛",
  },
};

export function getAgentStatus(agentId, timeOfDay) {
  const agent = AGENTS[agentId];
  if (!agent) return null;
  for (const slot of agent.schedule) {
    const inRange = slot.from <= slot.to
      ? (timeOfDay >= slot.from && timeOfDay < slot.to)
      : (timeOfDay >= slot.from || timeOfDay < slot.to);
    if (inRange) return { location: slot.location, activity: slot.activity };
  }
  return { location: agent.defaultLocation, activity: agent.defaultActivity };
}

// Maps activity names to the skill they train and XP earned per in-game minute.
const XP_RATES = {
  "锻造": { skill: "锻造入门", rate: 1 },
  "钓鱼": { skill: "钓鱼",    rate: 1 },
};

// Pure function — appends one entry to actionLog and trims to last 168.
export function pushActionLog(agent, tick, activity) {
  const entry = { tick, activity };
  const log = [...(agent.actionLog || []), entry];
  return { ...agent, actionLog: log.slice(-168) };
}

// Pure function — counts activity occurrences in actionLog.
// Returns [{ activity, count, percent }] sorted by percent descending.
export function summarizeIdentity(actionLog) {
  if (!actionLog || actionLog.length === 0) return [];
  const counts = {};
  for (const entry of actionLog) {
    counts[entry.activity] = (counts[entry.activity] || 0) + 1;
  }
  const total = actionLog.length;
  return Object.entries(counts)
    .map(([activity, count]) => ({ activity, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.percent - a.percent);
}

// Pure function — returns updated agent object, never mutates.
export function tickAgentSkillXp(agent, activity, minutesElapsed) {
  const rate = XP_RATES[activity];
  if (!rate) return agent;
  const newXp = { ...agent.xp, [rate.skill]: agent.xp[rate.skill] + minutesElapsed * rate.rate };
  const skills = agent.skills.map(s =>
    s.name === rate.skill
      ? { ...s, level: Math.floor(newXp[rate.skill] / 200) + 1 }
      : s
  );
  return { ...agent, xp: newXp, skills };
}

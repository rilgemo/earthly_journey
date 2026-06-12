export const NPCS = {
  老周: {
    id: "老周",
    name: "老周",
    skills: [
      { name: "锻造入门", level: 3 },
      { name: "钓鱼", level: 1 },
    ],
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
  const agent = NPCS[agentId];
  if (!agent) return null;
  for (const slot of agent.schedule) {
    const inRange = slot.from <= slot.to
      ? (timeOfDay >= slot.from && timeOfDay < slot.to)
      : (timeOfDay >= slot.from || timeOfDay < slot.to);
    if (inRange) return { location: slot.location, activity: slot.activity };
  }
  return { location: agent.defaultLocation, activity: agent.defaultActivity };
}

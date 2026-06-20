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
    skillHabit: { forge: 0, fishing: 0 },  // accumulated ingame hours per activity, drives driftSchedule
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

// Baseline schedule shape — driftSchedule always nudges from this, never
// from the agent's already-drifted schedule, so drift can't compound forever.
const BASE_SCHEDULE = AGENTS.lao_zhou.schedule.map(slot => ({ ...slot }));

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

// Phrasing tables for describeIdentityNarrative — never expose raw
// percentages/counts to the player; only qualitative Chinese narrative.
const LOCATION_PHRASE = {
  "锻造": "锻造铺打铁",
  "钓鱼": "河边钓鱼",
  "用餐": "旅店吃饭",
  "闲逛": "镇上闲逛",
};

// Noun-only place, used after "待在" — avoids stacking two verbs ("待在...打铁").
const PLACE_PHRASE = {
  "锻造": "锻造铺",
  "钓鱼": "河边",
  "用餐": "旅店",
  "闲逛": "镇上",
};

const SECONDARY_PHRASE = {
  "锻造": "去铺子里转转",
  "钓鱼": "傍晚去钓鱼",
  "用餐": "去旅店喝酒",
  "闲逛": "在镇上走走",
};

const LONG_TERM_TAIL = {
  "锻造": "已经很少看到他长时间离开炉台。",
  "钓鱼": "已经很少看到他空着手从河边回来。",
  "用餐": "旅店掌柜都认得他的座位了。",
  "闲逛": "他好像总能找到地方打发时间。",
};

function locationPhrase(activity) { return LOCATION_PHRASE[activity] || activity; }
function placePhrase(activity) { return PLACE_PHRASE[activity] || activity; }
function secondaryPhrase(activity) { return SECONDARY_PHRASE[activity] || `去${activity}`; }
function longTermTail(activity) { return LONG_TERM_TAIL[activity] || "这成了他最近的固定安排。"; }

// Share of entries matching `activity` within a slice of the log (0..1, internal use only).
function shareOf(entries, activity) {
  if (!entries.length) return 0;
  return entries.filter(e => e.activity === activity).length / entries.length;
}

const NO_PATTERN_LINE = "老周的生活看起来挺随性的，今天打铁，明天钓鱼，没什么固定的样子。";
const TOO_SHORT_LINE = "你认识老周还不够久，还看不出什么规律。";

// Pure function — turns actionLog into tiered qualitative Chinese narrative.
// Never returns percentages, counts, or the label "铁匠". Reads like a
// person's impression, not a data readout.
export function describeIdentityNarrative(actionLog) {
  const log = actionLog || [];
  const n = log.length;

  if (n < 10) return [TOO_SHORT_LINE];

  const summary = summarizeIdentity(log);
  if (summary.length === 0) return [TOO_SHORT_LINE];

  const top = summary[0];
  const second = summary[1];

  // Short-term (~1 day): only a single dominant-activity read is meaningful.
  if (n <= 30) {
    if (top.percent > 50) {
      return [`最近大部分时间，老周都在${locationPhrase(top.activity)}。`];
    }
    return [NO_PATTERN_LINE];
  }

  // Mid-term (~3 days): dominant pattern with an emerging secondary habit.
  if (n <= 80) {
    if (top.percent >= 40 && top.percent <= 65 && second && second.percent >= 15 && second.percent <= 30) {
      return [`最近几天老周经常待在${placePhrase(top.activity)}，偶尔${secondaryPhrase(second.activity)}。`];
    }
    if (top.percent > 50) {
      return [`最近几天，老周大部分时间都在${locationPhrase(top.activity)}。`];
    }
    return [NO_PATTERN_LINE];
  }

  // Long-term (~7 days): check whether dominance has deepened over time.
  if (top.percent < 35) return [NO_PATTERN_LINE];

  const mid = Math.floor(n / 2);
  const firstShare = shareOf(log.slice(0, mid), top.activity);
  const secondShare = shareOf(log.slice(mid), top.activity);

  if (secondShare > firstShare + 0.1) {
    return [`最近这段时间，老周大部分心思都放在了${top.activity}上，${longTermTail(top.activity)}`];
  }

  if (top.percent >= 40 && top.percent <= 65 && second && second.percent >= 15 && second.percent <= 30) {
    return [`最近几天老周经常待在${placePhrase(top.activity)}，偶尔${secondaryPhrase(second.activity)}。`];
  }

  if (top.percent > 50) {
    return [`最近这段时间，老周大部分时间都在${locationPhrase(top.activity)}。`];
  }

  return [NO_PATTERN_LINE];
}

// Anchor place/verb used by comparative narrative phrasing below.
const ANCHOR_PLACE = { "锻造": "炉台", "钓鱼": "河边" };
const ACTIVITY_VERB = { "锻造": "打铁", "钓鱼": "钓鱼", "用餐": "吃饭", "闲逛": "闲逛" };
function anchorPlace(activity) { return ANCHOR_PLACE[activity] || activity; }
function activityVerb(activity) { return ACTIVITY_VERB[activity] || activity; }

const SAME_AS_BEFORE_LINE = "老周还是老样子。";

// Dominance is compared by qualitative tier, not raw percentage-point delta —
// a 2% wobble in a rolling window isn't a "real" shift, but crossing from
// "moderate" to "strong" dominance is. Keeps the comparison narrative
// consistent with the narrative-over-numeric principle.
const TIER_WEAK_MAX = 40;     // < this = weak dominance
const TIER_STRONG_MIN = 65;   // >= this = strong dominance
const TIER_RANK = { weak: 0, moderate: 1, strong: 2 };
function dominanceTier(percent) {
  if (percent < TIER_WEAK_MAX) return "weak";
  if (percent >= TIER_STRONG_MIN) return "strong";
  return "moderate";
}

// Pure function — lightweight, qualitative-data summary of actionLog,
// for PLAYER-side memory only. Stores top/second activity + percent,
// not raw counts — this is what the player "remembers", not a stat sheet.
export function buildDistributionSummary(actionLog) {
  const summary = summarizeIdentity(actionLog);
  if (summary.length === 0) return null;
  return {
    topActivity: summary[0].activity,
    topPercent: summary[0].percent,
    secondActivity: summary[1]?.activity ?? null,
    secondPercent: summary[1]?.percent ?? null,
  };
}

// Pure function — compares the current actionLog-derived distribution to a
// prior observation's stored summary, and returns a qualitative Chinese
// comparison. Never invents a trend: if the data shows no real shift, it
// says so ("老周还是老样子。") instead of manufacturing change.
export function compareIdentityNarrative(actionLog, priorSummary) {
  const current = buildDistributionSummary(actionLog);
  if (!current || !priorSummary) return describeIdentityNarrative(actionLog);

  if (current.topActivity === priorSummary.topActivity) {
    const currentRank = TIER_RANK[dominanceTier(current.topPercent)];
    const priorRank = TIER_RANK[dominanceTier(priorSummary.topPercent)];
    if (currentRank > priorRank) {
      return [`和你记忆里的样子比，他最近似乎越来越少离开${anchorPlace(current.topActivity)}了。`];
    }
    if (currentRank < priorRank) {
      return [`比起你上次看到的样子，他好像没那么专注于${activityVerb(current.topActivity)}了。`];
    }
    return [SAME_AS_BEFORE_LINE];
  }

  // The dominant activity itself changed — that's a shift either way.
  if (current.topPercent >= (priorSummary.secondPercent ?? 0)) {
    return [`比起你上次看到的样子，他好像没那么专注于${activityVerb(priorSummary.topActivity)}了。`];
  }
  return [SAME_AS_BEFORE_LINE];
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

// Maps activity names to the skillHabit counter they accumulate.
const HABIT_KEYS = {
  "锻造": "forge",
  "钓鱼": "fishing",
};

// Pure function — increments the habit counter for `activity` by one
// ingame hour spent on it. Activities with no habit mapping are a no-op.
export function tickSkillHabit(agent, activity, ticksElapsed) {
  const key = HABIT_KEYS[activity];
  if (!key) return agent;
  const habit = agent.skillHabit || { forge: 0, fishing: 0 };
  return { ...agent, skillHabit: { ...habit, [key]: habit[key] + ticksElapsed } };
}

const HABIT_THRESHOLD = 50;   // ingame hours of imbalance per drift step
const DRIFT_STEP_MIN = 15;    // ingame minutes nudged per threshold step
const MAX_DRIFT_MIN = 120;    // hard cap: schedule can drift at most +/-2h from baseline
const MIN_BLOCK_MIN = 30;     // floor on forge2/fishing block length

// Pure function — nudges lao_zhou's schedule based on accumulated
// skillHabit imbalance. Always computed from BASE_SCHEDULE (not the
// agent's current schedule), so drift is bounded and never compounds.
// forge habit > fishing habit -> forge block grows, fishing block shrinks
// (and vice versa), capped at +/-MAX_DRIFT_MIN from the baseline boundary.
export function driftSchedule(agent) {
  const habit = agent.skillHabit || { forge: 0, fishing: 0 };
  const imbalance = habit.forge - habit.fishing;
  const rawDrift = Math.floor(imbalance / HABIT_THRESHOLD) * DRIFT_STEP_MIN;
  const drift = Math.max(-MAX_DRIFT_MIN, Math.min(MAX_DRIFT_MIN, rawDrift));

  return BASE_SCHEDULE.map((slot, i) => {
    if (i !== 2 && i !== 3) return { ...slot };
    const forge2 = BASE_SCHEDULE[2];
    const fishing = BASE_SCHEDULE[3];
    const forge2Len = forge2.to - forge2.from;
    const fishingLen = fishing.to - fishing.from;
    const maxPositive = fishingLen - MIN_BLOCK_MIN;   // how far forge2 can grow into fishing
    const maxNegative = -(forge2Len - MIN_BLOCK_MIN); // how far forge2 can shrink
    const boundedDrift = Math.max(maxNegative, Math.min(maxPositive, drift));
    if (i === 2) return { ...slot, to: forge2.to + boundedDrift };
    return { ...slot, from: fishing.from + boundedDrift };
  });
}

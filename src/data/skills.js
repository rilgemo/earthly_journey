// Skill type display colours
export const SKILL_TYPE_COLOR = {
  战斗: "#9e5a5a",
  生产: "#7c6fcd",
  采集: "#5a9e6f",
  辅助: "#b89a4a",
  隐藏: "#666",
};

// Skill slot count (test mode: all open)
export const SKILL_SLOTS = 10;

// Skill definitions — discovery triggers are handled in actions.js via unlockSkill
// This file serves as the authoritative reference for all skill metadata.
export const SKILL_DEFS = {
  草药知识: {
    name: "草药知识",
    type: "辅助",
    desc: "辨别常见草药的种类与药效。",
    stats: { HP: 2, 精神: 1 },
  },
  采集: {
    name: "采集",
    type: "采集",
    desc: "从自然环境中收集有用的材料。",
    stats: { 速度: 1, 灵巧: 2, HP: 1 },
  },
  辨别植物: {
    name: "辨别植物",
    type: "采集",
    desc: "能区分常见与罕见植物，提高采集品质。",
    stats: { 灵巧: 2, 精神: 1 },
  },
  采矿: {
    name: "采矿",
    type: "采集",
    desc: "从岩层中提取矿石的能力。",
    stats: { 物攻: 1, HP: 1 },
  },
  锻造入门: {
    name: "锻造入门",
    type: "生产",
    desc: "对金属锻造的基础感知，能够尝试简单的锻打工作。",
    stats: { 物攻: 1, 灵巧: 2 },
  },
  炼金入门: {
    name: "炼金入门",
    type: "生产",
    desc: "对药剂调配的基础理解。",
    stats: { 魔攻: 1, 灵巧: 2, 精神: 1 },
  },
  探索: {
    name: "探索",
    type: "辅助",
    desc: "对周遭世界的感知与探索能力。",
    stats: { 速度: 1, 灵巧: 1 },
  },
};

// XP required to reach next level (fixed for now, scaling formula TBD)
export const XP_PER_LEVEL = 20;

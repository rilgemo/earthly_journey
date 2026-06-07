const SKILL_KEYS = Object.freeze([
  'farming',
  'hunting',
  'tracking',
  'mining',
  'forging',
  'crafting',
  'communication',
  'teaching',
  'arcaneTheory',
  'arcaneManipulation',
  'fireManipulation',
  'waterManipulation',
  'earthManipulation',
  'airManipulation',
  'lifeManipulation'
]);

const ACTION_SKILLS = Object.freeze({
  forage: Object.freeze(['farming', 'tracking']),
  farm: Object.freeze(['farming', 'lifeManipulation', 'waterManipulation']),
  gather_water: Object.freeze(['waterManipulation']),
  hunt: Object.freeze(['hunting', 'tracking']),
  chop_wood: Object.freeze(['crafting']),
  mine: Object.freeze(['mining', 'earthManipulation']),
  forge: Object.freeze(['forging', 'fireManipulation']),
  craft_item: Object.freeze(['crafting']),
  cast_magic: Object.freeze(['arcaneManipulation']),
  channel_arcane: Object.freeze(['arcaneManipulation']),
  study_arcane: Object.freeze(['arcaneTheory']),
  meditate: Object.freeze(['arcaneManipulation']),
  communicate: Object.freeze(['communication']),
  share_information: Object.freeze(['communication']),
  trade: Object.freeze(['communication']),
  teach: Object.freeze(['teaching', 'communication']),
  attack: Object.freeze(['hunting']),
  defend: Object.freeze(['hunting']),
  flee: Object.freeze(['tracking'])
});

function createSkills(template = {}) {
  return Object.fromEntries(SKILL_KEYS.map(skill => [skill, template[skill] || 0]));
}

function ensureSkills(agent) {
  if (!agent.skills || Array.isArray(agent.skills)) {
    agent.skills = createSkills();
  } else {
    SKILL_KEYS.forEach((skill) => {
      if (typeof agent.skills[skill] !== 'number') {
        agent.skills[skill] = 0;
      }
    });
  }
  return agent.skills;
}

function getActionSkills(actionId) {
  return ACTION_SKILLS[actionId] || [];
}

function getActionSkillAffinity(agent, actionId) {
  const skills = ensureSkills(agent);
  const relevant = getActionSkills(actionId);
  if (!relevant.length) return 0;
  return relevant.reduce((sum, skill) => sum + (skills[skill] || 0), 0) / relevant.length;
}

module.exports = {
  ACTION_SKILLS,
  SKILL_KEYS,
  createSkills,
  ensureSkills,
  getActionSkillAffinity,
  getActionSkills
};

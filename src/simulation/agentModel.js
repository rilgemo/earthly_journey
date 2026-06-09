const { createSkills } = require('./skills/skillSystem');
const { createTraits } = require('./skills/traitSystem');
const { createConditionCapacity } = require('./life/conditionCapacityModel');

const createNPC = ({
  id,
  type = 'npc',
  location = 'meadow',
  rng = Math.random,
  skills = {},
  traits = {}
}) => {
  return {
    id,
    type,
    location,
    biology: createConditionCapacity(),
    stamina: 100,
    traits: createTraits(rng, traits),
    skills: createSkills(skills),
    knowledge: [],
    needs: {
      hunger: rng() * 50,
      fatigue: rng() * 50,
      manaNeed: 70,
      socialNeed: rng() * 20,
      safetyNeed: 40
    },
    affinities: { fire: 0, water: 0, earth: rng(), arcane: rng() },
    mana: {
      capacity: 100,
      current: 10 + rng() * 20,
      stability: 0.8,
      affinity: { fire:0, water:0, earth:0, arcane: 1.0 }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} },
    trustMap: {}
  };
};

module.exports = { createNPC };

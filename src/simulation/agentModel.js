const createNPC = ({ id, role = 'farmer', location = 'meadow', rng = Math.random }) => {
  return {
    id,
    role,
    location,
    hp: 100,
    stamina: 100,
    skills: [],
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

const createNPC = ({id, role='farmer', location='meadow'}) => {
  return {
    id,
    role,
    location,
    hp: 100,
    stamina: 100,
    skills: [],
    needs: {
      hunger: Math.random() * 50,
      fatigue: Math.random() * 50,
      manaNeed: 70,
      socialNeed: Math.random() * 20,
      safetyNeed: 40
    },
    affinities: { fire: 0, water: 0, earth: Math.random(), arcane: Math.random() },
    mana: {
      capacity: 100,
      current: 10 + Math.random()*20,
      stability: 0.8,
      affinity: { fire:0, water:0, earth:0, arcane: 1.0 }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} }
  };
};

module.exports = { createNPC };

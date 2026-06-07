const { createNPC } = require('../agentModel');
const { validateEntity } = require('../entitySchema');
const { createFieldState } = require('../elementalField/fieldState');
const { generateResourceMap } = require('../resourceGeography/resourceGenerator');
const { createArea } = require('../worldField');

const SCENARIO_NAME = 'Playable World Slice v1';
const WORLD_SIZE = 20;

const TERRAIN_FIELDS = Object.freeze({
  village: Object.freeze({ life: 60, arcane: 20 }),
  forest: Object.freeze({ life: 90, water: 40 }),
  river: Object.freeze({ water: 100, life: 30 }),
  mountain: Object.freeze({ earth: 100, fire: 20 })
});

const NPC_SKILL_SEEDS = Object.freeze([
  Object.freeze({ farming: 20, lifeManipulation: 5 }),
  Object.freeze({ hunting: 20, tracking: 15 }),
  Object.freeze({ forging: 20, mining: 15, crafting: 5 }),
  Object.freeze({ arcaneTheory: 20, arcaneManipulation: 15 })
]);

function createSeededRandom(seed = 12345) {
  let state = Number(seed) >>> 0;

  return function random() {
    state = ((state * 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function getTerrain(x, y) {
  if (x === 9 || x === 10) return 'river';
  if (x >= 6 && x <= 13 && y >= 6 && y <= 13) return 'village';
  if (y < 4) return 'mountain';
  return 'forest';
}

function tileId(x, y) {
  return `tile-${x}-${y}`;
}

function createScenarioWorld(seed = 12345) {
  const areas = new Map();
  const terrainLocations = {
    village: [],
    forest: [],
    river: [],
    mountain: []
  };

  for (let y = 0; y < WORLD_SIZE; y += 1) {
    for (let x = 0; x < WORLD_SIZE; x += 1) {
      const terrain = getTerrain(x, y);
      const id = tileId(x, y);
      const neighbors = [
        x > 0 ? tileId(x - 1, y) : null,
        x < WORLD_SIZE - 1 ? tileId(x + 1, y) : null,
        y > 0 ? tileId(x, y - 1) : null,
        y < WORLD_SIZE - 1 ? tileId(x, y + 1) : null
      ].filter(Boolean);
      const area = createArea(id, TERRAIN_FIELDS[terrain], {
        baselineField: TERRAIN_FIELDS[terrain],
        neighbors
      });

      area.terrain = terrain;
      areas.set(id, area);
      terrainLocations[terrain].push(id);
    }
  }

  return {
    tick: 0,
    width: WORLD_SIZE,
    height: WORLD_SIZE,
    areas,
    resourceMap: generateResourceMap({ width: WORLD_SIZE, height: WORLD_SIZE, seed }),
    terrainLocations,
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: {
      diffusionRate: 0.05,
      conversionRate: 0.001,
      regenRate: 0.02
    },
    emergenceHistory: {},
    emergenceConfig: {},
    stabilityGains: null,
    stabilityHistory: [],
    getField(areaId) {
      return this.areas.get(areaId)?.field || createFieldState();
    },
    getRecentEvents(areaId) {
      return this.areas.get(areaId)?.recentEvents.slice(-10) || [];
    },
    pushEvent(areaId, event) {
      const area = this.areas.get(areaId);
      if (!area) return;
      area.recentEvents.push(event);
      if (area.recentEvents.length > 50) area.recentEvents.shift();
    }
  };
}

function createScenarioAgent({ id, type, location, rng, skills = {} }) {
  const agent = createNPC({ id, type, location, rng, skills });
  agent.state = {
    hp: agent.hp,
    stamina: agent.stamina,
    skills: agent.skills
  };
  agent.attributes = {};
  agent.tags = [type];

  const validation = validateEntity(agent);
  if (!validation.valid) {
    throw new Error(`Invalid scenario entity '${id}': ${validation.issues.join(', ')}`);
  }

  return agent;
}

function pickLocation(locations, rng) {
  return locations[Math.floor(rng() * locations.length)];
}

function spawnScenarioAgents(world, rng) {
  const agents = [];

  NPC_SKILL_SEEDS.forEach((skills, seedIndex) => {
    for (let index = 1; index <= 3; index += 1) {
      agents.push(createScenarioAgent({
        id: `npc-${seedIndex + 1}-${index}`,
        type: 'npc',
        skills,
        location: pickLocation(seedIndex === 1 ? world.terrainLocations.forest : world.terrainLocations.village, rng),
        rng
      }));
    }
  });

  for (let index = 1; index <= 6; index += 1) {
    agents.push(createScenarioAgent({
      id: `animal-${index}`,
      type: 'animal',
      skills: { hunting: 5, tracking: 10 },
      location: pickLocation(world.terrainLocations.forest, rng),
      rng
    }));
  }

  for (let index = 1; index <= 2; index += 1) {
    agents.push(createScenarioAgent({
      id: `monster-${index}`,
      type: 'monster',
      skills: { hunting: 15, tracking: 8 },
      location: pickLocation(world.terrainLocations.mountain, rng),
      rng
    }));
  }

  return agents;
}

function createPlayableWorldSlice({ seed = 12345 } = {}) {
  const rng = createSeededRandom(seed);
  const world = createScenarioWorld(seed);
  const agents = spawnScenarioAgents(world, rng);

  return {
    name: SCENARIO_NAME,
    seed,
    world,
    agents
  };
}

module.exports = {
  SCENARIO_NAME,
  TERRAIN_FIELDS,
  WORLD_SIZE,
  createSeededRandom,
  createPlayableWorldSlice
};

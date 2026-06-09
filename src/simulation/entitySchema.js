const ENTITY_TYPES = Object.freeze([
  'player',
  'npc',
  'animal',
  'monster',
  'object',
  'environment'
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateEntity(entity) {
  const issues = [];

  if (!isPlainObject(entity)) {
    return {
      valid: false,
      issues: ['Entity must be an object']
    };
  }

  if (typeof entity.id !== 'string' || entity.id.length === 0) {
    issues.push('Entity id is required');
  }

  if (!ENTITY_TYPES.includes(entity.type)) {
    issues.push(`Entity type '${entity.type}' is not registered`);
  }

  if (typeof entity.location !== 'string' || entity.location.length === 0) {
    issues.push('Entity location is required');
  }

  if (!isPlainObject(entity.state)) {
    issues.push('Entity state must be an object');
  }

  if (entity.memory !== undefined && !isPlainObject(entity.memory)) {
    issues.push('Entity memory must be an object when provided');
  }

  if (entity.attributes !== undefined && !isPlainObject(entity.attributes)) {
    issues.push('Entity attributes must be an object when provided');
  }

  if (entity.tags !== undefined && !Array.isArray(entity.tags)) {
    issues.push('Entity tags must be an array when provided');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function createNpcEntity(overrides = {}) {
  return {
    id: 'npc_001',
    type: 'npc',
    location: 'meadow',
    state: {
      biology: {
        capacity: { structural: 'full', metabolic: 'full', immune: 'full', neural: 'full' },
        condition: { structural: 'sound', metabolic: 'sound', immune: 'sound', neural: 'sound' }
      },
      stamina: 100,
      skills: []
    },
    memory: {},
    attributes: {},
    tags: [],
    ...overrides
  };
}

function createMonsterEntity(overrides = {}) {
  return {
    id: 'monster_001',
    type: 'monster',
    location: 'cave',
    state: {
      biology: {
        capacity: { structural: 'full', metabolic: 'full', immune: 'full', neural: 'full' },
        condition: { structural: 'sound', metabolic: 'sound', immune: 'sound', neural: 'sound' }
      },
      aggression: 0.5
    },
    memory: {},
    attributes: {},
    tags: [],
    ...overrides
  };
}

function createAnimalEntity(overrides = {}) {
  return {
    id: 'animal_001',
    type: 'animal',
    location: 'forest',
    state: {
      biology: {
        capacity: { structural: 'full', metabolic: 'full', immune: 'full', neural: 'full' },
        condition: { structural: 'sound', metabolic: 'sound', immune: 'sound', neural: 'sound' }
      },
      hunger: 0.2
    },
    memory: {},
    attributes: {},
    tags: [],
    ...overrides
  };
}

module.exports = {
  ENTITY_TYPES,
  validateEntity,
  createNpcEntity,
  createMonsterEntity,
  createAnimalEntity
};

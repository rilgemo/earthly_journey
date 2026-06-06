/**
 * Entity Schema Contract
 *
 * Goal: World state shape is protected before mutation tests rely on it.
 */

const {
  ENTITY_TYPES,
  validateEntity,
  createNpcEntity,
  createMonsterEntity,
  createAnimalEntity
} = require('../../src/simulation/entitySchema');

describe('Entity Schema Contract', () => {
  test('NPC schema includes id and skills array', () => {
    const npc = createNpcEntity();

    expect(npc.id).toBeDefined();
    expect(npc.type).toBe('npc');
    expect(npc.state.skills).toBeInstanceOf(Array);
    expect(validateEntity(npc).valid).toBe(true);
  });

  test('monster schema uses monster type', () => {
    const monster = createMonsterEntity();

    expect(monster.type).toBe('monster');
    expect(validateEntity(monster).valid).toBe(true);
  });

  test('animal schema uses animal type', () => {
    const animal = createAnimalEntity();

    expect(animal.type).toBe('animal');
    expect(validateEntity(animal).valid).toBe(true);
  });

  test('invalid entity without id is rejected', () => {
    const invalid = {
      type: 'npc',
      location: 'meadow',
      state: { mana: 999 }
    };

    const result = validateEntity(invalid);

    expect(result.valid).toBe(false);
    expect(result.issues.join(' ')).toContain('id');
  });

  test('unregistered entity type is rejected', () => {
    const invalid = {
      id: 'ghost_001',
      type: 'ghost',
      location: 'ruins',
      state: {}
    };

    const result = validateEntity(invalid);

    expect(ENTITY_TYPES).not.toContain('ghost');
    expect(result.valid).toBe(false);
    expect(result.issues.join(' ')).toContain('not registered');
  });
});

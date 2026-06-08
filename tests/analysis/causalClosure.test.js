const fs = require('fs');
const path = require('path');

const { TraceCollector } = require('../../src/simulation/traceCollector');
const { resolveCultureEmergence } = require('../../src/simulation/culture/cultureEmergenceResolver');
const { buildCivilizationMemory } = require('../../src/simulation/civilizationMemory/civilizationMemoryBuilder');
const { generateCivilizationMyth } = require('../../src/simulation/civilizationMyth/mythGenerator');

const ROOT = path.resolve(__dirname, '../..');

function createWorld() {
  return {
    tick: 0,
    areas: new Map([
      ['meadow', {
        id: 'meadow',
        field: { fire: 0, water: 0, earth: 0.2, arcane: 0.05 },
        recentEvents: [],
      }],
    ]),
    getField(areaId) {
      return this.areas.get(areaId)?.field || {};
    },
    getRecentEvents(areaId) {
      return this.areas.get(areaId)?.recentEvents || [];
    },
  };
}

function createAgent() {
  return {
    id: 'closure_agent',
    type: 'npc',
    location: 'meadow',
    stamina: 60,
    maxStamina: 100,
    needs: { hunger: 0.35, fatigue: 0.2, social: 0.1 },
    affinities: { fire: 0, water: 0, earth: 0, arcane: 0 },
    mana: { current: 10, max: 10 },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} },
    traits: {},
    skills: {},
    knowledge: [],
    trustMap: {},
  };
}

function runtimeSnapshot(agent, world) {
  return JSON.parse(JSON.stringify({
    agent: {
      id: agent.id,
      location: agent.location,
      stamina: agent.stamina,
      needs: agent.needs,
      mana: agent.mana,
      memory: agent.memory,
      skills: agent.skills,
      knowledge: agent.knowledge,
    },
    world: {
      tick: world.tick,
      demandIndex: world.demandIndex,
      demandHistory: world.demandHistory,
      field: world.areas.get('meadow').field,
    },
  }));
}

function filesUnder(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(absolute, entry.name);
    return entry.isDirectory()
      ? filesUnder(path.relative(ROOT, child))
      : [child];
  });
}

function importStatements(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => /\b(require\(|from\s+['"])/.test(line))
    .join('\n');
}

describe('Causal Closure Verification v1', () => {
  test('observation collection cannot change execution or world state', () => {
    const { tickManager } = require('../../src/simulation/tickManager');
    const observedAgent = createAgent();
    const unobservedAgent = createAgent();
    const observedWorld = createWorld();
    const unobservedWorld = createWorld();

    const observedLog = tickManager([observedAgent], observedWorld, new TraceCollector());
    const unobservedLog = tickManager([unobservedAgent], unobservedWorld, null);

    expect(observedLog).toEqual(unobservedLog);
    expect(runtimeSnapshot(observedAgent, observedWorld))
      .toEqual(runtimeSnapshot(unobservedAgent, unobservedWorld));
  });

  test('no observation module imports decision or execution authority', () => {
    const observationRoots = [
      'src/analysis/causalIsolation',
      'src/analysis/semanticAudit',
      'src/simulation/culture',
      'src/simulation/civilizationMemory',
      'src/simulation/civilizationMyth',
      'src/simulation/settlement',
    ];
    const forbidden = /(?:simulation\/intent|simulation\\intent|tickManager|resolutionModel|intentGenerator)/;
    const violations = observationRoots.flatMap(filesUnder).filter((file) =>
      forbidden.test(importStatements(fs.readFileSync(file, 'utf8')))
    );

    expect(violations).toEqual([]);
  });

  test('decision and execution modules do not import observation systems', () => {
    const causalFiles = [
      ...filesUnder('src/simulation/intent'),
      path.join(ROOT, 'src/simulation/tickManager.js'),
      path.join(ROOT, 'src/simulation/resolutionModel.js'),
    ];
    const forbidden = /(?:culture|civilizationMemory|civilizationMyth|semanticAudit|causalIsolation|settlement|behavioralSignature)/;
    const violations = causalFiles.filter((file) =>
      forbidden.test(importStatements(fs.readFileSync(file, 'utf8')))
    );

    expect(violations).toEqual([]);
  });

  test('downstream reports are immutable and preserve their inputs', () => {
    const input = {
      cultureTraces: [],
      settlementSnapshots: [],
      behavioralHistory: [],
      demandHistory: [],
      resourceGeographyHistory: [],
      migrationPressureLogs: [],
      causalIsolationReports: [],
    };
    const before = JSON.stringify(input);
    const culture = resolveCultureEmergence([]);
    const memory = buildCivilizationMemory(input);
    const myth = generateCivilizationMyth({ civilizationMemories: [memory] });

    expect(JSON.stringify(input)).toBe(before);
    expect(Object.isFrozen(culture)).toBe(true);
    expect(Object.isFrozen(memory)).toBe(true);
    expect(Object.isFrozen(myth)).toBe(true);
  });
});

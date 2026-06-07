const { createArea } = require('./worldField');
const { createNPC } = require('./agentModel');
const { tickManager } = require('./tickManager');
const { TraceCollector } = require('./traceCollector');
const { ReplayBuffer } = require('./replayBuffer');

function createInspectorWorld() {
  const world = {
    tick: 0,
    areas: new Map(),
    addArea(area) {
      this.areas.set(area.id, area);
    },
    getField(areaId) {
      const area = this.areas.get(areaId);
      return area ? area.field : { fire: 0, water: 0, earth: 0, arcane: 0 };
    },
    getRecentEvents(areaId) {
      const area = this.areas.get(areaId);
      return area ? area.recentEvents.slice(-10) : [];
    }
  };

  world.addArea(createArea('meadow', { earth: 0.2, arcane: 0.05 }));
  world.addArea(createArea('town', { arcane: 0.02 }));

  return world;
}

function snapshotWorld(world, agents) {
  const areas = Array.from(world.areas.entries()).map(([id, area]) => ({
    id,
    field: { ...area.field },
    recentEvents: area.recentEvents.slice(-10)
  }));

  const fields = areas.reduce((acc, area) => {
    Object.entries(area.field).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + value;
    });
    return acc;
  }, { fire: 0, water: 0, earth: 0, arcane: 0 });

  return {
    tick: world.tick || 0,
    fields,
    areas,
    fieldDynamics: world.lastFieldDynamicsTrace || null,
    coupledEmergence: world.lastEmergenceTrace || null,
    stability: world.lastStabilityTrace || null,
    stabilityHistory: (world.stabilityHistory || []).slice(),
    scenarioSummary: world.scenarioSummary || null,
    agents: agents.map(agent => ({
      id: agent.id,
      name: agent.role || agent.id,
      role: agent.role,
      location: agent.location,
      mana: agent.mana.current,
      manaCapacity: agent.mana.capacity,
      state: `hunger:${(agent.needs.hunger || 0).toFixed(2)} fatigue:${(agent.needs.fatigue || 0).toFixed(2)}`,
      needs: agent.runtime?.lastNeeds || agent.needs,
      memories: agent.runtime?.lastMemories || [],
      influenceProfile: agent.runtime?.lastInfluenceProfile || {},
      topInfluences: agent.runtime?.lastTopInfluences || [],
      intents: agent.runtime?.lastIntents || [],
      selectedIntent: agent.runtime?.lastSelectedIntent || null,
      decisionTrace: agent.runtime?.lastDecisionTrace || null,
      traits: { ...(agent.traits || {}) },
      skills: { ...(agent.skills || {}) },
      skillGain: agent.runtime?.lastSkillGain || [],
      knowledgeCount: agent.knowledge?.length || 0,
      identities: [...(agent.identities || [])]
    }))
  };
}

export function createInspectorSimulationStream({ intervalMs = 2000, maxTraces = 80 } = {}) {
  const world = createInspectorWorld();
  const agents = [
    createNPC({ id: 'npc_1', role: 'farmer', location: 'meadow' }),
    createNPC({ id: 'npc_2', role: 'mage', location: 'meadow' }),
    createNPC({ id: 'npc_3', role: 'blacksmith', location: 'town' })
  ];
  const traceCollector = new TraceCollector(maxTraces);
  const replayBuffer = new ReplayBuffer(maxTraces);
  const listeners = new Set();
  let timer = null;

  function emit() {
    const replayFrames = replayBuffer.getAll();
    const latestTrace = traceCollector.getLatest();
    const payload = {
      world: snapshotWorld(world, agents),
      trace: traceCollector.getAll(),
      latestTrace,
      replayFrames,
      latestFrame: replayBuffer.latest()
    };
    listeners.forEach(listener => listener(payload));
    return payload;
  }

  function step() {
    tickManager(agents, world, traceCollector);
    replayBuffer.push({
      tick: world.tick || 0,
      worldSnapshot: snapshotWorld(world, agents),
      trace: traceCollector.getAll(),
      timestamp: Date.now()
    });
    return emit();
  }

  return {
    onTick(listener) {
      listeners.add(listener);
      listener({
        world: snapshotWorld(world, agents),
        trace: traceCollector.getAll(),
        latestTrace: traceCollector.getLatest(),
        replayFrames: replayBuffer.getAll(),
        latestFrame: replayBuffer.latest()
      });
      return () => listeners.delete(listener);
    },
    start() {
      if (timer) return;
      step();
      timer = setInterval(step, intervalMs);
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    },
    step,
    getSnapshot() {
      return {
        world: snapshotWorld(world, agents),
        trace: traceCollector.getAll(),
        latestTrace: traceCollector.getLatest(),
        replayFrames: replayBuffer.getAll(),
        latestFrame: replayBuffer.latest()
      };
    }
  };
}

'use strict';

const { createLineageEngine } = require('../../src/simulation/lineageEngine');

// ─── fixtures ────────────────────────────────────────────────────────────────

function agent(id, opts = {}) {
  return {
    id,
    lineage: opts.lineage ?? null,
    ...opts
  };
}

function newborn(id, parentIds, tick = 1) {
  return {
    id,
    lineage: {
      parentIds:  Object.freeze([...parentIds].sort()),
      birthTick:  tick,
      originTick: tick
    }
  };
}

// ─── engine creation ─────────────────────────────────────────────────────────

describe('createLineageEngine', () => {
  test('returns a frozen engine object', () => {
    const engine = createLineageEngine();
    expect(Object.isFrozen(engine)).toBe(true);
  });

  test('starts empty', () => {
    expect(createLineageEngine().size()).toBe(0);
  });
});

// ─── registerAgent (founding generation) ─────────────────────────────────────

describe('registerAgent', () => {
  test('registers an agent', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    expect(e.size()).toBe(1);
    expect(e.getRecord('A001')).not.toBeNull();
  });

  test('founding agent has generation 0', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    expect(e.getRecord('A001').generation).toBe(0);
  });

  test('founding agent has empty childrenIds', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    expect(e.getRecord('A001').childrenIds).toHaveLength(0);
  });

  test('idempotent — double-registering same id does not increase size', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    e.registerAgent(agent('A001'));
    expect(e.size()).toBe(1);
  });

  test('null agent does not throw', () => {
    const e = createLineageEngine();
    expect(() => e.registerAgent(null)).not.toThrow();
  });

  test('agent without id does not throw', () => {
    const e = createLineageEngine();
    expect(() => e.registerAgent({})).not.toThrow();
  });
});

// ─── registerBirth ────────────────────────────────────────────────────────────

describe('registerBirth', () => {
  function setupTwoParents() {
    const e = createLineageEngine();
    e.registerAgent(agent('P001'));
    e.registerAgent(agent('P002'));
    return e;
  }

  test('registers a newborn', () => {
    const e = setupTwoParents();
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    expect(e.size()).toBe(3);
    expect(e.getRecord('C001')).not.toBeNull();
  });

  test('newborn has generation 1 when parents are gen 0', () => {
    const e = setupTwoParents();
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    expect(e.getRecord('C001').generation).toBe(1);
  });

  test('newborn parentIds stored correctly', () => {
    const e = setupTwoParents();
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    const rec = e.getRecord('C001');
    expect(rec.parentIds).toEqual(expect.arrayContaining(['P001', 'P002']));
    expect(rec.parentIds).toHaveLength(2);
  });

  test('fatherId and motherId assigned from parentIds', () => {
    const e = setupTwoParents();
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    const rec = e.getRecord('C001');
    // parentIds are sorted, so P001 → fatherId, P002 → motherId
    expect([rec.fatherId, rec.motherId]).toEqual(expect.arrayContaining(['P001', 'P002']));
  });

  test('parent record updated with childrenId', () => {
    const e = setupTwoParents();
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    expect(e.getRecord('P001').childrenIds).toContain('C001');
    expect(e.getRecord('P002').childrenIds).toContain('C001');
  });

  test('second-generation newborn gets generation 2', () => {
    const e = setupTwoParents();
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    e.registerAgent(agent('P003'));
    e.registerBirth(newborn('G001', ['C001', 'P003']), []);
    expect(e.getRecord('G001').generation).toBe(2);
  });

  test('null newborn does not throw', () => {
    const e = createLineageEngine();
    expect(() => e.registerBirth(null, [])).not.toThrow();
  });
});

// ─── getRecord ────────────────────────────────────────────────────────────────

describe('getRecord', () => {
  test('returns null for unknown id', () => {
    expect(createLineageEngine().getRecord('UNKNOWN')).toBeNull();
  });

  test('returns record for known id', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    expect(e.getRecord('A001')).toMatchObject({ id: 'A001' });
  });
});

// ─── getAncestors ─────────────────────────────────────────────────────────────

describe('getAncestors', () => {
  test('returns empty for founding agent', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    expect(e.getAncestors('A001')).toHaveLength(0);
  });

  test('returns immediate parents for gen-1 child', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('P001'));
    e.registerAgent(agent('P002'));
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    const ancestors = e.getAncestors('C001').map(r => r.id);
    expect(ancestors).toContain('P001');
    expect(ancestors).toContain('P002');
  });

  test('returns grandparents for gen-2 child', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('GP1'));
    e.registerAgent(agent('GP2'));
    e.registerBirth(newborn('P001', ['GP1', 'GP2']), []);
    e.registerAgent(agent('P002'));
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    const ancestors = e.getAncestors('C001').map(r => r.id);
    expect(ancestors).toContain('P001');
    expect(ancestors).toContain('GP1');
    expect(ancestors).toContain('GP2');
  });

  test('returns empty array for unknown id', () => {
    expect(createLineageEngine().getAncestors('NOBODY')).toEqual([]);
  });
});

// ─── getDescendants ───────────────────────────────────────────────────────────

describe('getDescendants', () => {
  test('returns empty for childless agent', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    expect(e.getDescendants('A001')).toHaveLength(0);
  });

  test('returns immediate children', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('P001'));
    e.registerAgent(agent('P002'));
    e.registerBirth(newborn('C001', ['P001', 'P002']), []);
    const desc = e.getDescendants('P001').map(r => r.id);
    expect(desc).toContain('C001');
  });

  test('returns grandchildren', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A'));
    e.registerAgent(agent('B'));
    e.registerBirth(newborn('C', ['A', 'B']), []);
    e.registerAgent(agent('D'));
    e.registerBirth(newborn('E', ['C', 'D']), []);
    const desc = e.getDescendants('A').map(r => r.id);
    expect(desc).toContain('C');
    expect(desc).toContain('E');
  });

  test('returns empty for unknown id', () => {
    expect(createLineageEngine().getDescendants('NOBODY')).toEqual([]);
  });
});

// ─── getFamilyTree ────────────────────────────────────────────────────────────

describe('getFamilyTree', () => {
  test('returns null for unknown id', () => {
    expect(createLineageEngine().getFamilyTree('NOBODY')).toBeNull();
  });

  test('leaf node has empty children', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    const tree = e.getFamilyTree('A001');
    expect(tree.children).toHaveLength(0);
  });

  test('tree includes immediate children', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('P1'));
    e.registerAgent(agent('P2'));
    e.registerBirth(newborn('C1', ['P1', 'P2']), []);
    const tree = e.getFamilyTree('P1');
    expect(tree.children.map(c => c.id)).toContain('C1');
  });

  test('tree includes generation field', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('P1'));
    const tree = e.getFamilyTree('P1');
    expect(tree.generation).toBe(0);
  });
});

// ─── getGenerationDistribution ────────────────────────────────────────────────

describe('getGenerationDistribution', () => {
  test('returns empty object for empty engine', () => {
    expect(createLineageEngine().getGenerationDistribution()).toEqual({});
  });

  test('returns correct counts', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('P1'));
    e.registerAgent(agent('P2'));
    e.registerAgent(agent('P3'));
    e.registerBirth(newborn('C1', ['P1', 'P2']), []);
    e.registerBirth(newborn('C2', ['P2', 'P3']), []);

    const dist = e.getGenerationDistribution();
    expect(dist[0]).toBe(3); // P1, P2, P3
    expect(dist[1]).toBe(2); // C1, C2
  });
});

// ─── printTree ────────────────────────────────────────────────────────────────

describe('printTree', () => {
  test('returns string', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    expect(typeof e.printTree('A001')).toBe('string');
  });

  test('includes agent id in output', () => {
    const e = createLineageEngine();
    e.registerAgent(agent('A001'));
    expect(e.printTree('A001')).toContain('A001');
  });

  test('returns unknown marker for unregistered id', () => {
    const e = createLineageEngine();
    expect(e.printTree('NOBODY')).toContain('unknown');
  });
});

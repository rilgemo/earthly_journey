'use strict';

const { createLineageEngine } = require('../../src/simulation/lineageEngine');
const { buildLineageHistoryForAgents } = require('../../src/simulation/lineage/lineageVizEngine');
const {
  formatTimeline,
  formatFamilyView,
  formatGenerationSummary,
  formatFullReport
} = require('../../src/simulation/lineage/lineageFormatter');
const { buildSnapshot } = require('../../src/simulation/lineage/lineageSnapshot');

// ─── shared fixture ──────────────────────────────────────────────────────────

function makeEngine() {
  const e = createLineageEngine();

  // Gen 0 founders
  e.registerAgent({ id: 'Adam',  lineage: null });
  e.registerAgent({ id: 'Eve',   lineage: null });
  e.registerAgent({ id: 'Lilith', lineage: null });

  // Gen 1
  e.registerBirth({
    id: 'Cain',
    lineage: { parentIds: Object.freeze(['Adam', 'Eve']), birthTick: 10 }
  }, []);
  e.registerBirth({
    id: 'Abel',
    lineage: { parentIds: Object.freeze(['Adam', 'Eve']), birthTick: 12 }
  }, []);

  // Gen 2
  e.registerBirth({
    id: 'Enoch',
    lineage: { parentIds: Object.freeze(['Cain', 'Lilith']), birthTick: 30 }
  }, []);

  return e;
}

const ALL_IDS = ['Adam', 'Eve', 'Lilith', 'Cain', 'Abel', 'Enoch'];

// ─── buildLineageHistoryForAgents ─────────────────────────────────────────────

describe('buildLineageHistoryForAgents', () => {
  test('returns summary with correct totalAgents', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    expect(h.summary.totalAgents).toBe(6);
  });

  test('maxGeneration is 2', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    expect(h.summary.maxGeneration).toBe(2);
  });

  test('totalBirths counts only agents with parents', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    expect(h.summary.totalBirths).toBe(3); // Cain, Abel, Enoch
  });

  test('generations map is populated', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    expect(h.generations[0]).toHaveLength(3); // Adam, Eve, Lilith
    expect(h.generations[1]).toHaveLength(2); // Cain, Abel
    expect(h.generations[2]).toHaveLength(1); // Enoch
  });

  test('timeline events appear at correct ticks', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const byTick = Object.fromEntries(h.timeline.map(e => [e.tick, e.events]));
    expect(byTick[10]?.some(ev => ev.childId === 'Cain')).toBe(true);
    expect(byTick[12]?.some(ev => ev.childId === 'Abel')).toBe(true);
    expect(byTick[30]?.some(ev => ev.childId === 'Enoch')).toBe(true);
  });

  test('ORIGIN events have empty parentIds', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    for (const entry of h.timeline) {
      for (const ev of entry.events) {
        if (ev.type === 'ORIGIN') {
          expect(ev.parentIds).toHaveLength(0);
        }
      }
    }
  });

  test('BIRTH events have non-empty parentIds', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    for (const entry of h.timeline) {
      for (const ev of entry.events) {
        if (ev.type === 'BIRTH') {
          expect(ev.parentIds.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('familyClusters groups by familyId', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    expect(typeof h.familyClusters).toBe('object');
    const allInClusters = Object.values(h.familyClusters).flat();
    expect(allInClusters).toHaveLength(ALL_IDS.length);
  });

  test('returns empty history for null engine', () => {
    const h = buildLineageHistoryForAgents(null, ALL_IDS);
    expect(h.summary.totalAgents).toBe(0);
    expect(h.timeline).toHaveLength(0);
  });

  test('returns empty history for empty agentIds', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), []);
    expect(h.summary.totalAgents).toBe(0);
  });

  test('ignores ids not in engine', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ['NOBODY', 'Adam']);
    expect(h.summary.totalAgents).toBe(1);
  });

  test('timeline is sorted by tick ascending', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const ticks = h.timeline.map(e => e.tick);
    expect(ticks).toEqual([...ticks].sort((a, b) => a - b));
  });
});

// ─── formatTimeline ───────────────────────────────────────────────────────────

describe('formatTimeline', () => {
  test('returns a string', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    expect(typeof formatTimeline(h)).toBe('string');
  });

  test('contains tick markers', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const out = formatTimeline(h);
    expect(out).toContain('[Tick');
  });

  test('contains child id in BIRTH lines', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const out = formatTimeline(h);
    expect(out).toContain('Cain');
    expect(out).toContain('Enoch');
  });

  test('contains ORIGIN keyword for founders', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const out = formatTimeline(h);
    expect(out).toContain('ORIGIN');
  });

  test('returns fallback for empty history', () => {
    const out = formatTimeline({ timeline: [] });
    expect(out).toContain('no timeline');
  });
});

// ─── formatGenerationSummary ──────────────────────────────────────────────────

describe('formatGenerationSummary', () => {
  test('returns a string', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    expect(typeof formatGenerationSummary(h)).toBe('string');
  });

  test('contains Gen 0, Gen 1, Gen 2', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const out = formatGenerationSummary(h);
    expect(out).toContain('Gen 0');
    expect(out).toContain('Gen 1');
    expect(out).toContain('Gen 2');
  });

  test('contains total line', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const out = formatGenerationSummary(h);
    expect(out).toContain('Total:');
  });

  test('returns fallback for null history', () => {
    expect(formatGenerationSummary(null)).toContain('no generation');
  });
});

// ─── formatFamilyView ─────────────────────────────────────────────────────────

describe('formatFamilyView', () => {
  test('returns a string', () => {
    expect(typeof formatFamilyView(makeEngine(), 'Adam')).toBe('string');
  });

  test('contains root id', () => {
    expect(formatFamilyView(makeEngine(), 'Adam')).toContain('Adam');
  });

  test('contains children', () => {
    const out = formatFamilyView(makeEngine(), 'Adam');
    expect(out).toContain('Cain');
    expect(out).toContain('Abel');
  });

  test('returns not-found message for unknown id', () => {
    expect(formatFamilyView(makeEngine(), 'NOBODY')).toContain('not found');
  });

  test('returns fallback for null engine', () => {
    expect(formatFamilyView(null, 'Adam')).toContain('no family');
  });
});

// ─── formatFullReport ─────────────────────────────────────────────────────────

describe('formatFullReport', () => {
  test('returns a string', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    expect(typeof formatFullReport(h, makeEngine(), ['Adam'])).toBe('string');
  });

  test('contains WORLD LINEAGE REPORT header', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const out = formatFullReport(h, makeEngine(), ['Adam']);
    expect(out).toContain('WORLD LINEAGE REPORT');
  });

  test('contains all three section headings', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const out = formatFullReport(h, makeEngine(), ['Adam']);
    expect(out).toContain('GENERATION SUMMARY');
    expect(out).toContain('BIRTH TIMELINE');
    expect(out).toContain('FAMILY TREES');
  });
});

// ─── buildSnapshot ────────────────────────────────────────────────────────────

describe('buildSnapshot', () => {
  test('returns object with required fields', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const snap = buildSnapshot(h, makeEngine(), ALL_IDS, 42);
    expect(snap).toHaveProperty('world', 'earthly_journey');
    expect(snap).toHaveProperty('tick', 42);
    expect(snap).toHaveProperty('summary');
    expect(snap).toHaveProperty('timeline');
    expect(snap).toHaveProperty('agents');
    expect(snap).toHaveProperty('generations');
    expect(snap).toHaveProperty('familyClusters');
  });

  test('agents array has correct length', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const snap = buildSnapshot(h, makeEngine(), ALL_IDS, 1);
    expect(snap.agents).toHaveLength(ALL_IDS.length);
  });

  test('each agent record has required fields', () => {
    const h = buildLineageHistoryForAgents(makeEngine(), ALL_IDS);
    const snap = buildSnapshot(h, makeEngine(), ALL_IDS, 1);
    for (const a of snap.agents) {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('generation');
      expect(a).toHaveProperty('familyId');
      expect(a).toHaveProperty('childrenIds');
      expect(a).toHaveProperty('parentIds');
    }
  });

  test('tick is null when not provided', () => {
    const snap = buildSnapshot({}, makeEngine(), [], undefined);
    expect(snap.tick).toBeNull();
  });
});

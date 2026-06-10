'use strict';

/**
 * Lineage Formatter
 *
 * Converts a LineageHistory (from lineageVizEngine) into human-readable text.
 * No side effects. Pure string builders.
 *
 * Three formats:
 *   formatTimeline(history)   — tick-by-tick event log
 *   formatFamilyView(engine, rootId)  — ASCII tree rooted at an agent
 *   formatGenerationSummary(history)  — distribution table
 *   formatFullReport(history, engine) — all three combined
 */

// ─── Timeline log ─────────────────────────────────────────────────────────────

/**
 * formatTimeline(history) → string
 *
 * [Tick 12]
 *   BIRTH  P001, P002 → C001  (gen 1)
 *   BIRTH  P002, P003 → C002  (gen 1)
 *
 * [Tick 30]
 *   BIRTH  C001, X001 → G001  (gen 2)
 */
function formatTimeline(history) {
  if (!history?.timeline?.length) {
    return '(no timeline events)\n';
  }

  const lines = [];

  for (const entry of history.timeline) {
    lines.push(`[Tick ${entry.tick}]`);

    for (const ev of entry.events) {
      if (ev.type === 'ORIGIN') {
        lines.push(`  ORIGIN  ${ev.childId}  (gen ${ev.generation})`);
      } else {
        const parents = ev.parentIds.join(', ');
        lines.push(`  BIRTH   ${parents} → ${ev.childId}  (gen ${ev.generation})`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

// ─── Family view ──────────────────────────────────────────────────────────────

/**
 * formatFamilyView(lineageEngine, rootId) → string
 *
 * Uses lineageEngine.printTree() internally (already ASCII-formatted).
 * Adds a header and generation annotations per node.
 */
function formatFamilyView(lineageEngine, rootId) {
  if (!lineageEngine || !rootId) return '(no family data)\n';

  const rec = lineageEngine.getRecord(rootId);
  if (!rec) return `(agent "${rootId}" not found in lineage engine)\n`;

  const header = `Family line of ${rootId} (gen ${rec.generation}):\n`;
  const tree   = lineageEngine.printTree(rootId);
  return header + tree;
}

// ─── Generation summary ───────────────────────────────────────────────────────

/**
 * formatGenerationSummary(history) → string
 *
 * Gen 0:  3 agents
 * Gen 1:  5 agents
 * Gen 2:  2 agents
 * ─────────────────
 * Total:  10 agents  |  max gen: 2
 */
function formatGenerationSummary(history) {
  if (!history?.generations) return '(no generation data)\n';

  const lines = [];
  const { generations, summary } = history;
  const genKeys = Object.keys(generations).map(Number).sort((a, b) => a - b);

  for (const g of genKeys) {
    const ids   = generations[g] || [];
    const bar   = '█'.repeat(Math.min(ids.length, 40));
    lines.push(`Gen ${g}:  ${String(ids.length).padStart(3)} agent${ids.length === 1 ? ' ' : 's'}  ${bar}`);
  }

  lines.push('─'.repeat(40));
  lines.push(
    `Total:  ${summary.totalAgents} agents  |  ` +
    `max gen: ${summary.maxGeneration}  |  ` +
    `births: ${summary.totalBirths}  |  ` +
    `families: ${summary.totalFamilies}`
  );

  return lines.join('\n') + '\n';
}

// ─── Full report ──────────────────────────────────────────────────────────────

/**
 * formatFullReport(history, lineageEngine?, rootIds?) → string
 *
 * Combines all three views into one printable report.
 *
 * @param {object}   history        — from buildLineageHistoryForAgents
 * @param {object}   [lineageEngine] — for family trees (optional)
 * @param {string[]} [rootIds]       — gen-0 ids to print trees for (optional)
 */
function formatFullReport(history, lineageEngine, rootIds) {
  const sep = '═'.repeat(50) + '\n';
  const sections = [];

  sections.push(sep + 'WORLD LINEAGE REPORT\n' + sep);

  sections.push('── GENERATION SUMMARY ──────────────────────────\n');
  sections.push(formatGenerationSummary(history));

  sections.push('── BIRTH TIMELINE ──────────────────────────────\n');
  sections.push(formatTimeline(history));

  if (lineageEngine && Array.isArray(rootIds) && rootIds.length > 0) {
    sections.push('── FAMILY TREES ────────────────────────────────\n');
    for (const rootId of rootIds) {
      sections.push(formatFamilyView(lineageEngine, rootId));
    }
  }

  return sections.join('\n');
}

module.exports = {
  formatTimeline,
  formatFamilyView,
  formatGenerationSummary,
  formatFullReport
};

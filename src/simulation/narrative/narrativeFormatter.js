'use strict';

/**
 * Narrative Formatter
 *
 * Converts NarrativeOutput (from narrativeEngine) into human-readable text.
 * Three formats: tick log, world digest, full report.
 */

const TYPE_ICONS = Object.freeze({
  BIRTH:        '🌱',
  DEATH:        '💀',
  RELATIONSHIP: '🤝',
  STRUCTURE:    '⚠',
  ECOLOGY:      '🌍'
});

/**
 * formatTickLog(output) → string
 *
 * [Tick 120]
 * 🌱 Adam and Eve brought Cain into the world (generation 1).
 * ⚠  Causal flow reversed between reproductionField and matingEvents.
 */
function formatTickLog(output) {
  if (!output) return '(no output)\n';

  const lines = [];
  lines.push(`[Tick ${output.tick ?? '?'}]`);

  if (!output.sentences || output.sentences.length === 0) {
    lines.push('  (quiet tick)');
  } else {
    for (const s of output.sentences) {
      const icon = TYPE_ICONS[s.type] ?? '·';
      lines.push(`  ${icon}  ${s.text}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * formatWorldDigest(outputs) → string
 *
 * WORLD DIGEST (Tick 100–120)
 * ───────────────────────────────
 * Births:     3
 * Deaths:     1
 * Violations: 0
 *
 * Summary:
 * Three new lives entered the world. Generation 2 is now present.
 */
function formatWorldDigest(outputs) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    return '(no digest data)\n';
  }

  const first = outputs[0].tick ?? '?';
  const last  = outputs[outputs.length - 1].tick ?? '?';

  let totalBirths     = 0;
  let totalDeaths     = 0;
  let totalViolations = 0;
  let maxGeneration   = 0;
  const summaries     = [];

  for (const o of outputs) {
    const ws = o.worldState ?? {};
    totalBirths     += ws.totalBirths     ?? 0;
    totalDeaths     += ws.totalDeaths     ?? 0;
    totalViolations += ws.activeViolations ?? 0;
    if ((ws.generationPeak ?? 0) > maxGeneration) maxGeneration = ws.generationPeak;
    if (o.summary) summaries.push(o.summary);
  }

  const lines = [];
  lines.push(`WORLD DIGEST (Tick ${first}–${last})`);
  lines.push('─'.repeat(40));
  lines.push(`Births:      ${totalBirths}`);
  lines.push(`Deaths:      ${totalDeaths}`);
  lines.push(`Violations:  ${totalViolations}`);
  lines.push(`Max gen:     ${maxGeneration}`);
  lines.push('');
  lines.push('Summary:');

  // De-duplicate consecutive identical summaries
  let prev = '';
  for (const s of summaries) {
    if (s !== prev && s !== 'A quiet tick passed without notable events.') {
      lines.push(`  ${s}`);
      prev = s;
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * formatFullReport(outputs) → string
 *
 * Combines world digest + per-tick log.
 */
function formatFullReport(outputs) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    return '(no narrative data)\n';
  }

  const sep = '═'.repeat(50) + '\n';
  const parts = [];

  parts.push(sep + 'WORLD NARRATIVE REPORT\n' + sep + '\n');
  parts.push(formatWorldDigest(outputs) + '\n');
  parts.push('── TICK LOG ────────────────────────────────────\n\n');

  for (const o of outputs) {
    const log = formatTickLog(o);
    if (!log.includes('(quiet tick)')) {
      parts.push(log);
    }
  }

  return parts.join('');
}

module.exports = { formatTickLog, formatWorldDigest, formatFullReport, TYPE_ICONS };

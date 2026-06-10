'use strict';

/**
 * Narrative Memory
 *
 * A rolling window of NarrativeOutput objects, one per tick.
 * Provides tick-range queries and aggregate statistics.
 * Maximum window size is configurable (default 200 ticks).
 */

const DEFAULT_MAX_TICKS = 200;

function createNarrativeMemory(maxTicks) {
  const _max     = Math.max(1, maxTicks ?? DEFAULT_MAX_TICKS);
  const _outputs = []; // NarrativeOutput[], oldest-first

  /**
   * Append a NarrativeOutput for the current tick.
   * Evicts oldest entry when window is full.
   */
  function append(output) {
    if (!output) return;
    _outputs.push(output);
    if (_outputs.length > _max) _outputs.shift();
  }

  /**
   * All outputs in the current window (oldest → newest).
   */
  function all() {
    return [..._outputs];
  }

  /**
   * Outputs for a specific tick range [fromTick, toTick] inclusive.
   */
  function range(fromTick, toTick) {
    return _outputs.filter(o =>
      (o.tick ?? -Infinity) >= fromTick &&
      (o.tick ?? Infinity)  <= toTick
    );
  }

  /**
   * The most recent N outputs.
   */
  function recent(n) {
    return _outputs.slice(-Math.max(1, n));
  }

  /**
   * Aggregate stats across the window.
   */
  function stats() {
    let totalBirths     = 0;
    let totalDeaths     = 0;
    let totalViolations = 0;
    let maxGeneration   = 0;

    for (const o of _outputs) {
      const ws = o.worldState ?? {};
      totalBirths     += ws.totalBirths      ?? 0;
      totalDeaths     += ws.totalDeaths      ?? 0;
      totalViolations += ws.activeViolations ?? 0;
      if ((ws.generationPeak ?? 0) > maxGeneration) maxGeneration = ws.generationPeak;
    }

    return {
      tickCount:      _outputs.length,
      tickRange:      _outputs.length > 0
        ? [_outputs[0].tick, _outputs[_outputs.length - 1].tick]
        : null,
      totalBirths,
      totalDeaths,
      totalViolations,
      maxGeneration
    };
  }

  /** Number of outputs in the window. */
  function size() { return _outputs.length; }

  /** Discard all history. */
  function clear() { _outputs.length = 0; }

  return Object.freeze({ append, all, range, recent, stats, size, clear });
}

module.exports = { createNarrativeMemory, DEFAULT_MAX_TICKS };

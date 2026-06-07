function actionSequence(history = []) {
  return history.map(entry => entry.action).filter(Boolean);
}

function countSequences(actions, length) {
  const counts = {};
  for (let index = 0; index <= actions.length - length; index += 1) {
    const sequence = actions.slice(index, index + length).join(' -> ');
    counts[sequence] = (counts[sequence] || 0) + 1;
  }
  return counts;
}

function extractFrequentSequences(history = [], options = {}) {
  const actions = actionSequence(history);
  const maxLength = options.maxSequenceLength || 3;
  const minimumCount = options.minimumCount || 2;
  const sequences = [];

  for (let length = 2; length <= maxLength; length += 1) {
    Object.entries(countSequences(actions, length)).forEach(([sequence, count]) => {
      if (count >= minimumCount) sequences.push({ sequence: sequence.split(' -> '), count });
    });
  }

  return sequences.sort((first, second) => (
    second.count - first.count || second.sequence.length - first.sequence.length
  ));
}

function extractTransitionMatrix(history = []) {
  const actions = actionSequence(history);
  const counts = {};

  for (let index = 0; index < actions.length - 1; index += 1) {
    const from = actions[index];
    const to = actions[index + 1];
    if (!counts[from]) counts[from] = {};
    counts[from][to] = (counts[from][to] || 0) + 1;
  }

  return Object.fromEntries(Object.entries(counts).map(([from, transitions]) => {
    const total = Object.values(transitions).reduce((sum, count) => sum + count, 0);
    return [from, Object.fromEntries(Object.entries(transitions)
      .map(([to, count]) => [to, count / total]))];
  }));
}

function detectLoops(history = [], options = {}) {
  const actions = actionSequence(history);
  const maxLoopLength = options.maxLoopLength || 4;
  const loops = [];

  for (let length = 1; length <= maxLoopLength; length += 1) {
    for (let start = 0; start <= actions.length - (length * 2); start += 1) {
      const pattern = actions.slice(start, start + length);
      let repetitions = 1;
      while (
        start + ((repetitions + 1) * length) <= actions.length
        && patternMatchesAt(actions, pattern, start + (repetitions * length))
      ) {
        repetitions += 1;
      }
      if (repetitions >= 2) {
        loops.push({ pattern, repetitions, start, strength: (length * repetitions) / actions.length });
      }
    }
  }

  const unique = new Map();
  loops.forEach(loop => {
    const key = loop.pattern.join(' -> ');
    const existing = unique.get(key);
    if (!existing || loop.repetitions > existing.repetitions) unique.set(key, loop);
  });
  return [...unique.values()].sort((first, second) => second.strength - first.strength);
}

function calculateExplorationIndex(history = []) {
  const actions = actionSequence(history);
  if (!actions.length) return 0;
  return new Set(actions).size / actions.length;
}

function patternMatchesAt(actions, pattern, start) {
  for (let offset = 0; offset < pattern.length; offset += 1) {
    if (actions[start + offset] !== pattern[offset]) return false;
  }
  return true;
}

function extractBehaviorPatterns(history = []) {
  const loopPatterns = detectLoops(history);
  return {
    frequentSequences: extractFrequentSequences(history),
    transitionMatrix: extractTransitionMatrix(history),
    loopPatterns,
    explorationIndex: calculateExplorationIndex(history),
    stableCycles: loopPatterns.filter(loop => loop.repetitions >= 3)
  };
}

module.exports = {
  actionSequence,
  calculateExplorationIndex,
  detectLoops,
  extractBehaviorPatterns,
  extractFrequentSequences,
  extractTransitionMatrix
};

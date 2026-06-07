function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function seededUnit(seed, salt = '') {
  const text = `${seed}:${salt}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function calculateDistanceAccuracy(distance = 0, observationRange = 10) {
  return clamp01(1 / (1 + (Math.max(0, distance) / Math.max(1, observationRange))));
}

function calculateMemoryAccuracy(eventTick = 0, currentTick = eventTick, decayRate = 0.02) {
  const age = Math.max(0, currentTick - eventTick);
  return clamp01(1 - (age * decayRate));
}

function compressDetails(details = {}, quality = 1, seed = 0) {
  return Object.fromEntries(Object.entries(details).filter(([key]) => (
    seededUnit(seed, `detail:${key}`) <= clamp01(quality)
  )));
}

function distortInformation(event, options = {}) {
  const distanceAccuracy = calculateDistanceAccuracy(options.distance, options.observationRange);
  const trust = clamp01(options.trust ?? 1);
  const memoryAccuracy = calculateMemoryAccuracy(event.tick, options.currentTick ?? event.tick, options.memoryDecayRate);
  const communicationQuality = clamp01(options.communicationQuality ?? 1);
  const accuracy = clamp01(distanceAccuracy * memoryAccuracy * communicationQuality);
  const confidence = clamp01((options.baseConfidence ?? 1) * accuracy * (0.5 + (trust * 0.5)));
  const noise = ((seededUnit(options.seed ?? 0, event.id || event.type || 'event') * 2) - 1)
    * (1 - accuracy)
    * (options.maxNoise ?? 0.25);
  const distortedValue = typeof event.value === 'number'
    ? event.value * (1 + noise)
    : event.value;

  return {
    event: {
      ...event,
      eventKey: event.eventKey || event.id || event.type,
      value: distortedValue,
      details: compressDetails(event.details, communicationQuality, options.seed),
      perceivedAccuracy: accuracy,
      sourceType: options.sourceType || event.sourceType || 'observed'
    },
    accuracy,
    confidence,
    factors: {
      distanceAccuracy,
      trust,
      memoryAccuracy,
      communicationQuality,
      noise
    }
  };
}

function identifyContradictions(events = []) {
  const grouped = events.reduce((result, event) => {
    const key = event.eventKey || event.id || event.type || 'event';
    if (!result[key]) result[key] = [];
    result[key].push(event);
    return result;
  }, {});

  return Object.fromEntries(Object.entries(grouped).filter(([, beliefs]) => (
    new Set(beliefs.map(event => event.claim ?? event.target ?? event.value)).size > 1
  )));
}

module.exports = {
  calculateDistanceAccuracy,
  calculateMemoryAccuracy,
  compressDetails,
  distortInformation,
  identifyContradictions,
  seededUnit
};

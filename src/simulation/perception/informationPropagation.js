const { prepareInformationTransfer } = require('../communicationSystem');
const { applyBeliefUpdate, createBeliefState } = require('./beliefState');
const { distortInformation } = require('./perceptionDistortion');

function propagateInformation({
  source,
  receiver,
  beliefState,
  memory,
  tick = 0,
  distance = 0,
  observationRange = 10,
  communicationQuality = 0.9,
  seed = 0
}) {
  const transfer = prepareInformationTransfer(source, receiver, {
    memory,
    tick,
    communicationQuality
  });
  if (!transfer) {
    return {
      beliefState: createBeliefState(beliefState),
      transfer: null,
      update: null
    };
  }

  const distorted = distortInformation(transfer.heardMemory, {
    distance,
    observationRange,
    trust: transfer.trust,
    communicationQuality: transfer.communicationQuality,
    currentTick: tick,
    seed,
    sourceType: 'heard'
  });
  const update = {
    eventKey: distorted.event.eventKey,
    event: distorted.event,
    confidence: distorted.confidence,
    sourceId: source.id
  };

  return {
    beliefState: applyBeliefUpdate(beliefState || createBeliefState(), update),
    transfer,
    update,
    distortion: distorted.factors
  };
}

module.exports = {
  propagateInformation
};

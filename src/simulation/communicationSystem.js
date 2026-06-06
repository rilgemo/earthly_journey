const { getTrustFactor } = require('./socialGraph');
const { createHeardMemory, getShareableMemories } = require('./socialMemory');

function calculateTransferStrength(memoryStrength, trustFactor, communicationQuality = 0.9) {
  return Math.max(0, memoryStrength * trustFactor * communicationQuality);
}

function prepareInformationTransfer(source, receiver, options = {}) {
  const memory = options.memory || getShareableMemories(source)[0];
  if (!memory || !receiver) return null;

  const trust = getTrustFactor(receiver, source.id);
  const communicationQuality = options.communicationQuality ?? 0.9;
  const strength = calculateTransferStrength(memory.strength || 0, trust, communicationQuality);

  if (strength <= 0) return null;

  return {
    sourceId: source.id,
    receiverId: receiver.id,
    trust,
    communicationQuality,
    originalMemory: memory,
    heardMemory: createHeardMemory(memory, source.id, strength, options.tick || 0)
  };
}

module.exports = {
  calculateTransferStrength,
  prepareInformationTransfer
};

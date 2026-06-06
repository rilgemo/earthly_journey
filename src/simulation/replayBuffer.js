function cloneSnapshot(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

class ReplayBuffer {
  constructor(maxFrames = 500) {
    this.maxFrames = maxFrames;
    this.frames = [];
  }

  push(frame) {
    this.frames.push(cloneSnapshot(frame));

    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
  }

  get(index) {
    return this.frames[index] || null;
  }

  latest() {
    return this.frames[this.frames.length - 1] || null;
  }

  size() {
    return this.frames.length;
  }

  getAll() {
    return this.frames.slice();
  }
}

module.exports = {
  ReplayBuffer,
  cloneSnapshot
};

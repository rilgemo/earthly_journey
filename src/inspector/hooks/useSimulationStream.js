import { useEffect, useMemo, useState } from 'react';

export function useSimulationStream(simulator) {
  const initialSnapshot = simulator?.getSnapshot?.() || { world: null, trace: [], replayFrames: [] };
  const [liveWorld, setLiveWorld] = useState(initialSnapshot.world);
  const [liveTrace, setLiveTrace] = useState(initialSnapshot.trace || []);
  const [replayFrames, setReplayFrames] = useState(initialSnapshot.replayFrames || []);
  const [frameIndex, setFrameIndex] = useState(null);

  useEffect(() => {
    if (!simulator?.onTick) return undefined;

    const unsubscribe = simulator.onTick((tickData) => {
      setLiveWorld(tickData.world || null);
      setLiveTrace(tickData.trace || []);
      setReplayFrames(tickData.replayFrames || []);
    });

    simulator.start?.();

    return () => {
      unsubscribe?.();
      simulator.stop?.();
    };
  }, [simulator]);

  const activeFrame = frameIndex === null ? null : replayFrames[frameIndex] || null;
  const world = activeFrame?.worldSnapshot || liveWorld;
  const trace = activeFrame?.trace || liveTrace;
  const frameCount = replayFrames.length;

  const replayControls = useMemo(() => ({
    currentFrame: frameIndex,
    frameCount,
    isLive: frameIndex === null,
    onPrev() {
      setFrameIndex((current) => {
        if (!frameCount) return null;
        if (current === null) return Math.max(0, frameCount - 2);
        return Math.max(0, current - 1);
      });
    },
    onNext() {
      setFrameIndex((current) => {
        if (current === null) return null;
        const next = current + 1;
        return next >= frameCount - 1 ? null : next;
      });
    },
    onLive() {
      setFrameIndex(null);
    }
  }), [frameIndex, frameCount]);

  return {
    world,
    trace,
    replayFrames,
    replay: replayControls
  };
}

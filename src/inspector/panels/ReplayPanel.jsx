import React from 'react';

export default function ReplayPanel({
  currentFrame,
  frameCount,
  isLive,
  onPrev,
  onNext,
  onLive
}) {
  const displayFrame = isLive ? frameCount : (currentFrame ?? 0) + 1;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Replay</h3>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" onClick={onPrev} disabled={frameCount < 2}>
          Prev
        </button>

        <button type="button" onClick={onNext} disabled={isLive || frameCount < 2}>
          Next
        </button>

        <button type="button" onClick={onLive} disabled={isLive}>
          Live
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        Mode: {isLive ? 'LIVE' : 'REPLAY'}
      </div>

      <div>
        Frame {displayFrame || 0} / {frameCount}
      </div>
    </div>
  );
}

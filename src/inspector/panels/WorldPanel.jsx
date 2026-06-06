import React from 'react';

export default function WorldPanel({ world }) {
  if (!world) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>World</h3>

      <div>Tick: {world.tick ?? 0}</div>
      <div>Fire: {(world.fields?.fire ?? 0).toFixed(3)}</div>
      <div>Water: {(world.fields?.water ?? 0).toFixed(3)}</div>
      <div>Earth: {(world.fields?.earth ?? 0).toFixed(3)}</div>
      <div>Arcane: {(world.fields?.arcane ?? 0).toFixed(3)}</div>

      <div style={{ marginTop: 8 }}>
        <b>Agents:</b> {world.agents?.length ?? 0}
      </div>

      <div style={{ marginTop: 8 }}>
        <b>Areas:</b> {world.areas?.length ?? 0}
      </div>
    </div>
  );
}

import React from 'react';

export default function FieldViewer({ field }) {
  if (!field) return null;
  return (
    <div style={{padding:10, border:'1px solid #ddd'}}>
      <h4>Fields</h4>
      <div>🔥 Fire: {field.fire}</div>
      <div>🌊 Water: {field.water}</div>
      <div>🌿 Earth: {field.earth}</div>
      <div>✨ Arcane: {field.arcane}</div>
    </div>
  );
}

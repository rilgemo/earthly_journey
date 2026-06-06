import React from 'react';

export default function ScenarioSummaryPanel({ world }) {
  const summary = world?.scenarioSummary;
  if (!summary) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Scenario Summary</h3>
      <div>Current day: {summary.currentDay}</div>
      <div>NPC population: {summary.population?.npc ?? 0}</div>
      <div>Animal population: {summary.population?.animal ?? 0}</div>
      <div>Monster population: {summary.population?.monster ?? 0}</div>
      <div>Deaths: {Object.values(summary.deaths || {}).reduce((sum, value) => sum + value, 0)}</div>
      <div>Stability score: {(summary.stabilityScore ?? 0).toFixed(3)}</div>
    </div>
  );
}

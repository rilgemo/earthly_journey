const { ACTION_REGISTRY } = require('../actionRegistry');

const ACTION_KEYS = ACTION_REGISTRY;

function createActionDistribution() {
  return Object.fromEntries(ACTION_KEYS.map(action => [action, 0]));
}

function normalizeAction(action) {
  return ACTION_KEYS.includes(action) ? action : null;
}

function round(value) {
  return Number((value || 0).toFixed(6));
}

function createSimulationReport(data) {
  return {
    scenario: data.scenario,
    daysSimulated: data.daysSimulated,
    population: { ...data.population },
    deaths: { ...data.deaths },
    actionDistribution: { ...data.actionDistribution },
    socialMetrics: { ...data.socialMetrics },
    fieldMetrics: Object.fromEntries(
      Object.entries(data.fieldMetrics).map(([key, value]) => [key, round(value)])
    ),
    stabilityMetrics: Object.fromEntries(
      Object.entries(data.stabilityMetrics).map(([key, value]) => [key, round(value)])
    ),
    eventSummary: { ...data.eventSummary },
    replay: { ...data.replay }
  };
}

function formatSimulationReport(report) {
  return [
    `Simulation Report: ${report.scenario}`,
    `Days: ${report.daysSimulated}`,
    `Population: npc=${report.population.npc}, animal=${report.population.animal}, monster=${report.population.monster}`,
    `Deaths: npc=${report.deaths.npc}, animal=${report.deaths.animal}, monster=${report.deaths.monster}`,
    `Actions: ${Object.entries(report.actionDistribution).map(([key, value]) => `${key}=${value}`).join(', ')}`,
    `Social: created=${report.socialMetrics.memoriesCreated}, transferred=${report.socialMetrics.memoriesTransferred}, forgotten=${report.socialMetrics.memoriesForgotten}`,
    `Field drift: fire=${report.fieldMetrics.fireDrift}, water=${report.fieldMetrics.waterDrift}, life=${report.fieldMetrics.lifeDrift}, arcane=${report.fieldMetrics.arcaneDrift}`,
    `Stability: field=${report.stabilityMetrics.fieldInstability}, social=${report.stabilityMetrics.socialInstability}, emergence=${report.stabilityMetrics.emergenceInstability}, global=${report.stabilityMetrics.globalStabilityScore}`,
    `Events: combat=${report.eventSummary.combat}, death=${report.eventSummary.death}, communication=${report.eventSummary.communication}, field=${report.eventSummary.field}`,
    `Replay frames: ${report.replay.frameCount}`
  ].join('\n');
}

function printSimulationReport(report, logger = console.log) {
  const output = formatSimulationReport(report);
  logger(output);
  return output;
}

module.exports = {
  ACTION_KEYS,
  createActionDistribution,
  normalizeAction,
  createSimulationReport,
  formatSimulationReport,
  printSimulationReport
};

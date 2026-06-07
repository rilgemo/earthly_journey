const { ACTION_REGISTRY } = require('../../simulation/actionRegistry');

function narrativeFromAction(action) {
  return action
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') + ' Action';
}

const CORE_MAPPINGS = [
  {
    runtimeTerm: 'settlement',
    narrativeTerms: ['Activity Cluster'],
    category: 'system',
    stability: 'semi-stable'
  },
  {
    runtimeTerm: 'protoEconomy',
    narrativeTerms: ['Resource Exchange System'],
    category: 'system',
    stability: 'semi-stable'
  },
  {
    runtimeTerm: 'trade',
    narrativeTerms: ['Exchange Action'],
    category: 'action',
    stability: 'locked'
  },
  {
    runtimeTerm: 'migrationPressure',
    narrativeTerms: ['Distribution Pressure Field'],
    category: 'system',
    stability: 'semi-stable'
  },
  {
    runtimeTerm: 'behaviorSignature',
    narrativeTerms: ['Behavioral Pattern Trace'],
    category: 'concept',
    stability: 'locked'
  },
  {
    runtimeTerm: 'tickManager',
    narrativeTerms: ['Mutation Authority'],
    category: 'system',
    stability: 'locked'
  },
  {
    runtimeTerm: 'resolutionModel',
    narrativeTerms: ['Final Intent Arbitration'],
    category: 'system',
    stability: 'locked'
  },
  {
    runtimeTerm: 'worldDemand',
    narrativeTerms: ['Opportunity Pressure Layer'],
    category: 'system',
    stability: 'semi-stable'
  },
  {
    runtimeTerm: 'elementalField',
    narrativeTerms: ['Physical Reality Field'],
    category: 'system',
    stability: 'semi-stable'
  },
  {
    runtimeTerm: 'perceptionDrift',
    narrativeTerms: ['Controlled Drift'],
    category: 'concept',
    stability: 'evolving'
  }
];

const ACTION_MAPPINGS = ACTION_REGISTRY.map(action => ({
  runtimeTerm: action,
  narrativeTerms: action === 'trade' ? ['Exchange Action'] : [narrativeFromAction(action)],
  category: 'action',
  stability: 'locked'
}));

const SEMANTIC_REGISTRY = Object.freeze(
  [...CORE_MAPPINGS, ...ACTION_MAPPINGS.filter(
    actionMapping => !CORE_MAPPINGS.some(core => core.runtimeTerm === actionMapping.runtimeTerm)
  )].map(entry => Object.freeze({
    ...entry,
    narrativeTerms: Object.freeze([...entry.narrativeTerms])
  }))
);

const CATEGORY_VALUES = Object.freeze(['system', 'action', 'concept', 'resource']);
const STABILITY_VALUES = Object.freeze(['locked', 'semi-stable', 'evolving']);

module.exports = {
  SEMANTIC_REGISTRY,
  CATEGORY_VALUES,
  STABILITY_VALUES
};

import React from 'react';
import { render, screen } from '@testing-library/react';
import SemanticConsistencyPanel from '../../src/inspector/panels/SemanticConsistencyPanel';

const { SEMANTIC_REGISTRY } = require('../../src/analysis/semanticAudit/semanticRegistry');
const { createTermMapper } = require('../../src/analysis/semanticAudit/termMapper');
const { detectSemanticDrift } = require('../../src/analysis/semanticAudit/driftDetector');
const { compareSemanticLayers } = require('../../src/analysis/semanticAudit/layerComparator');
const { buildSemanticConsistencyReport } = require('../../src/analysis/semanticAudit/consistencyReportBuilder');

const CLEAN_INPUT = Object.freeze({
  runtimeTerms: Object.freeze([
    'settlement',
    'protoEconomy',
    'trade',
    'migrationPressure',
    'behaviorSignature',
    'tickManager',
    'resolutionModel'
  ]),
  narrativeTerms: Object.freeze([
    'Activity Cluster',
    'Resource Exchange System',
    'Exchange Action',
    'Distribution Pressure Field',
    'Behavioral Pattern Trace',
    'Mutation Authority',
    'Final Intent Arbitration'
  ]),
  inspectorLabels: Object.freeze(['Resource Exchange System', 'Activity Cluster']),
  testDescriptions: Object.freeze(['Final Intent Arbitration']),
  architectureTerms: Object.freeze(['Opportunity Pressure Layer']),
  files: Object.freeze([])
});

describe('Semantic Consistency Audit v1', () => {
  test('all runtime systems have at least one narrative mapping', () => {
    const mapper = createTermMapper();

    CLEAN_INPUT.runtimeTerms.forEach(term => {
      const mapping = mapper.getByRuntime(term);
      expect(mapping).toBeTruthy();
      expect(mapping.narrativeTerms.length).toBeGreaterThan(0);
    });
  });

  test('no duplicate conflicting mappings exist', () => {
    const conflicts = detectSemanticDrift(CLEAN_INPUT).filter(
      item => item.type === 'inconsistent mapping'
    );

    expect(conflicts).toHaveLength(0);
  });

  test('no runtime term is mapped to incompatible categories', () => {
    const categoriesByRuntime = new Map();

    SEMANTIC_REGISTRY.forEach(entry => {
      const categories = categoriesByRuntime.get(entry.runtimeTerm) || new Set();
      categories.add(entry.category);
      categoriesByRuntime.set(entry.runtimeTerm, categories);
    });

    categoriesByRuntime.forEach(categories => {
      expect(categories.size).toBe(1);
    });
  });

  test('deterministic report generation', () => {
    const report = buildSemanticConsistencyReport(CLEAN_INPUT, {
      timestamp: '2026-06-08T00:00:00.000Z'
    });

    expect(report).toMatchObject({
      timestamp: '2026-06-08T00:00:00.000Z',
      totalTerms: 15,
      mappedTerms: 7,
      driftScore: 0
    });
    expect(report.orphanRuntimeTerms).toHaveLength(0);
    expect(report.orphanNarrativeTerms).toHaveLength(0);
    expect(report.inconsistencies).toHaveLength(0);
  });

  test('stable output across repeated runs', () => {
    const first = buildSemanticConsistencyReport(CLEAN_INPUT);
    const second = buildSemanticConsistencyReport(CLEAN_INPUT);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.mappingGraph)).toBe(true);
  });

  test('inspector reads only computed report', () => {
    const report = buildSemanticConsistencyReport(CLEAN_INPUT);
    const before = JSON.stringify(report);

    render(<SemanticConsistencyPanel report={report} />);

    expect(screen.getByText('Semantic Consistency')).toBeInTheDocument();
    expect(screen.getByText('Drift Score: 0')).toBeInTheDocument();
    expect(JSON.stringify(report)).toBe(before);
  });

  test('no runtime mutation occurs', () => {
    const runtimeState = Object.freeze({
      tick: 1,
      agents: Object.freeze([{ id: 'agent_1', stamina: 10 }])
    });
    const before = JSON.stringify(runtimeState);

    compareSemanticLayers(CLEAN_INPUT);
    detectSemanticDrift(CLEAN_INPUT);
    buildSemanticConsistencyReport(CLEAN_INPUT);

    expect(JSON.stringify(runtimeState)).toBe(before);
    expect(runtimeState.agents[0].stamina).toBe(10);
  });

  test('detects missing mapping and orphan narrative terms', () => {
    const report = buildSemanticConsistencyReport({
      runtimeTerms: ['unknownRuntimeSystem'],
      narrativeTerms: ['Unmapped Narrative Concept']
    });

    expect(report.orphanRuntimeTerms).toContain('unknownRuntimeSystem');
    expect(report.orphanNarrativeTerms).toContain('Unmapped Narrative Concept');
    expect(report.inconsistencies.map(item => item.type)).toEqual(expect.arrayContaining([
      'missing mapping',
      'orphan narrative term'
    ]));
  });
});

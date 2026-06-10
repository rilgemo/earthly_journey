(function () {
  'use strict';

  const vscode = acquireVsCodeApi();

  // ─── DOM refs ──────────────────────────────────────────────────────────────
  const tickLabel        = document.getElementById('tick-label');
  const driftScore       = document.getElementById('drift-score');
  const driftLabel       = document.getElementById('drift-label');
  const driftBar         = document.getElementById('drift-bar');
  const nodeChain        = document.getElementById('node-chain');
  const edgeList         = document.getElementById('edge-list');
  const violationSection = document.getElementById('violation-section');
  const violationList    = document.getElementById('violation-list');

  // ─── message handler ──────────────────────────────────────────────────────
  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.type !== 'UPDATE_GRAPH') return;
    msg.data ? render(msg.data) : renderEmpty();
  });

  // ─── render ───────────────────────────────────────────────────────────────
  function render(data) {
    const { current, diff } = data;

    tickLabel.textContent = diff
      ? `Tick ${diff.fromTick ?? '?'} → ${diff.toTick ?? '?'}`
      : `Tick ${current.tick ?? '?'}`;

    if (diff) {
      renderDriftMeter(diff.causalDriftScore, diff.driftLevel);
      renderNodes(diff.nodes);
      renderEdges(diff.edges);
      renderViolations(diff.violations);
    } else {
      clearDriftMeter();
      renderNodes(current.nodes.map(n => ({ id: n.id, layer: n.layer, rank: n.rank, status: 'unchanged' })));
      renderEdges(current.edges.map(e => ({ from: e.from, to: e.to, status: 'unchanged' })));
      renderViolations(current.violations || []);
    }
  }

  function renderEmpty() {
    tickLabel.textContent = 'Waiting for simulation…';
    clearDriftMeter();
    nodeChain.innerHTML = '<span class="empty-hint">Run simulation with EARTHLY_CI_GRAPH=true to start.</span>';
    edgeList.innerHTML = '';
    violationSection.classList.add('hidden');
  }

  // ─── drift meter ──────────────────────────────────────────────────────────
  function renderDriftMeter(score, level) {
    driftScore.textContent = score.toFixed(3);
    driftScore.style.color = level.color;
    driftLabel.textContent = level.label.toUpperCase();
    driftLabel.style.color = level.color;
    driftBar.style.width = (score * 100).toFixed(1) + '%';
    driftBar.style.background = level.color;
  }

  function clearDriftMeter() {
    driftScore.textContent = '—';
    driftScore.style.color = '';
    driftLabel.textContent = 'no baseline';
    driftLabel.style.color = '';
    driftBar.style.width = '0%';
    driftBar.style.background = '';
  }

  // ─── node chain ───────────────────────────────────────────────────────────
  function renderNodes(nodes) {
    nodeChain.innerHTML = '';
    if (!nodes || nodes.length === 0) {
      nodeChain.innerHTML = '<span class="empty-hint">No nodes.</span>';
      return;
    }

    const sorted = [...nodes].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

    sorted.forEach((node, i) => {
      const chip = document.createElement('span');
      chip.className = 'node-chip node-' + node.status;
      chip.textContent = node.id;
      chip.title = buildNodeTooltip(node);
      nodeChain.appendChild(chip);

      if (i < sorted.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'node-arrow';
        arrow.textContent = '→';
        nodeChain.appendChild(arrow);
      }
    });
  }

  function buildNodeTooltip(node) {
    let tip = node.id + ' [' + node.layer + ']';
    if (node.layerFrom) { tip += '\nLayer: ' + node.layerFrom + ' → ' + node.layerTo; }
    if (node.status !== 'unchanged') { tip += '\nStatus: ' + node.status; }
    return tip;
  }

  // ─── edge diff panel ──────────────────────────────────────────────────────
  function renderEdges(edges) {
    edgeList.innerHTML = '';
    if (!edges || edges.length === 0) {
      edgeList.innerHTML = '<span class="empty-hint">No edges.</span>';
      return;
    }

    const order = ['reversed', 'added', 'removed', 'unchanged'];
    const sorted = [...edges].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

    for (const edge of sorted) {
      const row = document.createElement('div');
      row.className = 'edge-row edge-' + edge.status;
      row.textContent = edgePrefix(edge.status) + ' ' + edge.from + ' → ' + edge.to;
      edgeList.appendChild(row);
    }
  }

  function edgePrefix(status) {
    if (status === 'added')    return '+';
    if (status === 'removed')  return '−';
    if (status === 'reversed') return '↺';
    return ' ';
  }

  // ─── violation list ───────────────────────────────────────────────────────
  function renderViolations(violations) {
    if (!violations || violations.length === 0) {
      violationSection.classList.add('hidden');
      return;
    }

    violationSection.classList.remove('hidden');
    violationList.innerHTML = '';

    for (const v of violations) {
      const row = document.createElement('div');
      row.className = 'violation-row violation-' + v.type.toLowerCase().replace(/_/g, '-');

      const badge = document.createElement('span');
      badge.className = 'violation-badge';
      badge.textContent = v.type;

      const reason = document.createElement('span');
      reason.className = 'violation-reason';
      reason.textContent = v.reason;

      row.appendChild(badge);
      row.appendChild(reason);
      violationList.appendChild(row);
    }
  }

})();

(function () {
  'use strict';

  // ── DOM refs ───────────────────────────────────────────────────────────────

  const tickLabel      = document.getElementById('tick-label');
  const statusBadge    = document.getElementById('status-badge');
  const graphChain     = document.getElementById('graph-chain');
  const violationsSection = document.getElementById('violations-section');
  const violationsList = document.getElementById('violations-list');
  const emptyState     = document.getElementById('empty-state');
  const metaVersion    = document.getElementById('meta-version');
  const metaHash       = document.getElementById('meta-hash');
  const metaSchema     = document.getElementById('meta-schema');

  // ── Render ─────────────────────────────────────────────────────────────────

  function renderGraph(ir) {
    emptyState.style.display = 'none';

    // Header
    tickLabel.textContent = ir.tick !== null ? `Tick ${ir.tick}` : 'Tick —';
    statusBadge.textContent = ir.status;
    statusBadge.className = 'PASS FAIL'.includes(ir.status) ? ir.status : '';

    // Graph chain
    graphChain.innerHTML = '';
    const nodes = ir.nodes || [];
    const edges = ir.edges || [];

    // Build edge lookup: from → to
    const edgeSet = new Set(edges.map(e => `${e.from}:${e.to}`));

    nodes.forEach((node, index) => {
      const chip = document.createElement('div');
      chip.className = `node-chip ${node.layer || ''}`;
      chip.title = `rank: ${node.rank ?? '?'} | layer: ${node.layer}`;

      const idSpan = document.createElement('span');
      idSpan.className = 'node-id';
      idSpan.textContent = node.id;

      const layerSpan = document.createElement('span');
      layerSpan.className = 'node-layer';
      layerSpan.textContent = node.layer;

      chip.appendChild(idSpan);
      chip.appendChild(layerSpan);
      graphChain.appendChild(chip);

      // Add arrow if there is an edge to the next node
      if (index < nodes.length - 1) {
        const nextNode = nodes[index + 1];
        const hasEdge = edgeSet.has(`${node.id}:${nextNode.id}`);
        if (hasEdge) {
          const arrow = document.createElement('span');
          arrow.className = 'edge-arrow';
          arrow.textContent = '▶';
          graphChain.appendChild(arrow);
        }
      }
    });

    // Violations
    const violations = ir.violations || [];
    if (violations.length > 0) {
      violationsSection.style.display = 'block';
      violationsList.innerHTML = '';

      violations.forEach(v => {
        const row = document.createElement('div');
        row.className = 'violation-row';

        const typeSpan = document.createElement('span');
        typeSpan.className = 'violation-type';
        typeSpan.textContent = v.type;

        const detail = document.createElement('div');
        detail.className = 'violation-detail';

        const edge = document.createElement('div');
        edge.className = 'violation-edge';
        edge.textContent = `${v.from} → ${v.to}`;

        const reason = document.createElement('div');
        reason.className = 'violation-reason';
        reason.textContent = v.reason;

        detail.appendChild(edge);
        detail.appendChild(reason);
        row.appendChild(typeSpan);
        row.appendChild(detail);
        violationsList.appendChild(row);
      });
    } else {
      violationsSection.style.display = 'none';
    }

    // Meta footer
    const meta = ir.meta || {};
    metaVersion.textContent = `v: ${meta.version || '?'}`;
    metaHash.textContent    = `hash: ${meta.canonicalOrderHash || '?'}`;
    metaSchema.textContent  = meta.layerSchema || '';
  }

  function renderEmpty() {
    emptyState.style.display = 'block';
    graphChain.innerHTML = '';
    violationsSection.style.display = 'none';
    tickLabel.textContent = '—';
    statusBadge.textContent = '—';
    statusBadge.className = '';
  }

  // ── Message handler ────────────────────────────────────────────────────────

  window.addEventListener('message', event => {
    const msg = event.data;
    if (!msg || msg.type !== 'UPDATE_GRAPH') return;
    if (!msg.data) {
      renderEmpty();
      return;
    }
    renderGraph(msg.data);
  });

})();

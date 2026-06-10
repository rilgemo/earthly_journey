import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const cmd = vscode.commands.registerCommand('ciGraph.open', () => {
    if (panel) {
      panel.reveal();
      return;
    }

    panel = vscode.window.createWebviewPanel(
      'ciGraph',
      'CI Graph Overlay',
      vscode.ViewColumn.Two,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const filePath = path.join(
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '',
      'docs', 'ci', 'graph', 'latest.json'
    );

    const sendUpdate = () => {
      if (!fs.existsSync(filePath)) return;
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        panel?.webview.postMessage({ type: 'UPDATE_GRAPH', payload: data });
      } catch {
        // malformed JSON — skip this tick
      }
    };

    fs.watchFile(filePath, { interval: 500 }, sendUpdate);

    panel.webview.html = getHtml();

    // send current state immediately on open
    sendUpdate();

    panel.onDidDispose(() => {
      panel = undefined;
      fs.unwatchFile(filePath);
    });
  });

  context.subscriptions.push(cmd);
}

export function deactivate(): void {
  if (panel) panel.dispose();
}

// ─── inline HTML ──────────────────────────────────────────────────────────────

function getHtml(): string {
  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 14px 18px;
    }

    #header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    #header h2 { font-size: 14px; font-weight: 600; }
    #tick-label { font-size: 12px; color: var(--vscode-descriptionForeground); }

    /* ── drift meter ── */
    #drift-section { margin-bottom: 16px; }
    #drift-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 5px; }
    .section-label {
      font-size: 10px; font-weight: 700;
      letter-spacing: .08em;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
    }
    #drift-score { font-size: 20px; font-weight: 700; line-height: 1; }
    #drift-label { font-size: 11px; font-weight: 600; letter-spacing: .06em; }
    #drift-track {
      height: 5px; border-radius: 3px;
      background: var(--vscode-panel-border); overflow: hidden;
    }
    #drift-bar { height: 100%; width: 0%; border-radius: 3px; transition: width .3s, background .3s; }

    /* ── panels ── */
    .panel { margin-bottom: 14px; }
    .panel-title {
      font-size: 10px; font-weight: 700;
      letter-spacing: .08em; text-transform: uppercase;
      color: var(--vscode-descriptionForeground); margin-bottom: 6px;
    }
    .violation-title { color: #e07070; }
    .empty-hint { font-size: 11px; color: var(--vscode-descriptionForeground); font-style: italic; }

    /* ── node chain ── */
    #node-chain { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
    .node-chip {
      display: inline-block; padding: 3px 9px;
      border-radius: 4px; border: 1px solid;
      font-size: 12px; font-weight: 600; cursor: default; white-space: nowrap;
    }
    .node-unchanged { border-color:#3a6a3a; background:#1a2e1a; color:#a8d8a8; }
    .node-added     { border-color:#4ec94e; background:#1a2e1a; color:#4ec94e; box-shadow:0 0 0 1px #4ec94e44; }
    .node-removed   { border-color:#e05050; background:#2e1a1a; color:#e07070; text-decoration:line-through; opacity:.75; }
    .node-layer     { border-color:#d4c94a; background:#2a2a0a; color:#d4c94a; }
    .node-arrow     { font-size: 13px; color: var(--vscode-descriptionForeground); user-select: none; }

    /* ── edge list ── */
    #edge-list { display: flex; flex-direction: column; gap: 3px; }
    .edge-row {
      font-size: 12px; padding: 2px 8px; border-radius: 3px;
      font-family: 'Cascadia Code', Consolas, monospace;
    }
    .edge-unchanged { color: var(--vscode-foreground); opacity: .5; }
    .edge-added     { color: #4ec94e; background: #1a2e1a; }
    .edge-removed   { color: #e07070; background: #2e1a1a; text-decoration: line-through; opacity: .8; }
    .edge-reversed  { color: #e08030; background: #2e1e0a; font-weight: 700; }

    /* ── violations ── */
    #violation-section { display: none; }
    #violation-list { display: flex; flex-direction: column; gap: 4px; }
    .violation-row {
      display: flex; align-items: baseline; gap: 8px;
      padding: 5px 10px;
      border-left: 3px solid #e07070; background: #2e1a1a;
      border-radius: 0 4px 4px 0;
    }
    .v-causal-reversal { border-color:#e08030; background:#2e1e0a; }
    .v-layer-drift     { border-color:#d4c94a; background:#2a2a0a; }
    .v-high-drift      { border-color:#e05050; background:#2e1a1a; }
    .violation-badge   { font-size:10px; font-weight:700; color:#e07070; white-space:nowrap; }
    .violation-reason  { font-size:11px; color:var(--vscode-descriptionForeground); }

    /* ── waiting ── */
    #waiting { color:var(--vscode-descriptionForeground); font-size:12px; margin-top:24px; line-height:1.6; }
  </style>
</head>
<body>
  <div id="header">
    <h2>CI Graph</h2>
    <span id="tick-label">—</span>
  </div>

  <div id="waiting">
    Waiting for simulation…<br>
    Run with <code>EARTHLY_CI_GRAPH=true</code> to start live updates.
  </div>

  <div id="main" style="display:none">
    <div id="drift-section">
      <div id="drift-row">
        <span class="section-label">Causal Drift</span>
        <span id="drift-score">—</span>
        <span id="drift-label"></span>
      </div>
      <div id="drift-track"><div id="drift-bar"></div></div>
    </div>

    <div class="panel">
      <div class="panel-title">Nodes</div>
      <div id="node-chain"></div>
    </div>

    <div class="panel">
      <div class="panel-title">Edges</div>
      <div id="edge-list"></div>
    </div>

    <div id="violation-section">
      <div class="panel-title violation-title">⚠ Violations</div>
      <div id="violation-list"></div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const $ = id => document.getElementById(id);

    window.addEventListener('message', e => {
      if (e.data.type === 'UPDATE_GRAPH') {
        $('waiting').style.display = 'none';
        $('main').style.display = 'block';
        render(e.data.payload);
      }
    });

    function render(data) {
      const nodes = data.nodes || [];
      const edges = data.edges || [];
      const diff  = data.diff  || null;

      // ── tick label ────────────────────────────────────────────────────────
      $('tick-label').textContent = 'Tick ' + (data.tick ?? '?');

      // ── drift meter ───────────────────────────────────────────────────────
      const score = diff?.causalDriftScore;
      if (score != null) {
        const level = driftLevel(score);
        $('drift-score').textContent = score.toFixed(3);
        $('drift-score').style.color = level.color;
        $('drift-label').textContent = level.label;
        $('drift-label').style.color = level.color;
        $('drift-bar').style.width   = (score * 100).toFixed(1) + '%';
        $('drift-bar').style.background = level.color;
      } else {
        $('drift-score').textContent = '—';
        $('drift-label').textContent = 'first tick';
        $('drift-bar').style.width = '0%';
      }

      // ── nodes ─────────────────────────────────────────────────────────────
      const addedIds   = new Set(diff?.nodes?.added   || []);
      const removedIds = new Set(diff?.nodes?.removed  || []);
      const layerIds   = new Set((diff?.nodes?.layerChanged || []).map(lc => lc.id));

      const chainEl = $('node-chain');
      chainEl.innerHTML = '';
      const sorted = [...nodes].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
      sorted.forEach((n, i) => {
        const cls = addedIds.has(n.id)  ? 'node-added'
                  : removedIds.has(n.id) ? 'node-removed'
                  : layerIds.has(n.id)   ? 'node-layer'
                  : 'node-unchanged';

        const chip = document.createElement('span');
        chip.className = 'node-chip ' + cls;
        chip.textContent = n.id;
        chip.title = n.id + ' [' + n.layer + '] rank:' + (n.rank ?? '?');
        chainEl.appendChild(chip);

        if (i < sorted.length - 1) {
          const arr = document.createElement('span');
          arr.className = 'node-arrow';
          arr.textContent = '→';
          chainEl.appendChild(arr);
        }
      });

      // ── edges ─────────────────────────────────────────────────────────────
      function edgeKey(e) { return e.from + '->' + e.to; }
      const addedEdges    = new Set((diff?.edges?.added    || []).map(edgeKey));
      const removedEdges  = new Set((diff?.edges?.removed  || []).map(edgeKey));
      const reversedEdges = new Set((diff?.edges?.reversed || []).map(edgeKey));

      const edgeEl = $('edge-list');
      edgeEl.innerHTML = '';

      // show diff edges first (reversed > added > removed), then unchanged
      const allEdgeKeys = new Map(edges.map(e => [edgeKey(e), e]));
      const diffEdges   = [
        ...(diff?.edges?.reversed || []).map(e => ({ ...e, status: 'reversed' })),
        ...(diff?.edges?.added    || []).map(e => ({ ...e, status: 'added'    })),
        ...(diff?.edges?.removed  || []).map(e => ({ ...e, status: 'removed'  })),
      ];
      const shownKeys = new Set(diffEdges.map(edgeKey));
      const unchangedEdges = edges
        .filter(e => !shownKeys.has(edgeKey(e)))
        .map(e => ({ ...e, status: 'unchanged' }));

      [...diffEdges, ...unchangedEdges].forEach(e => {
        const row = document.createElement('div');
        row.className = 'edge-row edge-' + e.status;
        const prefix = e.status === 'added' ? '+ ' : e.status === 'removed' ? '− ' : e.status === 'reversed' ? '↺ ' : '  ';
        row.textContent = prefix + e.from + ' → ' + e.to;
        edgeEl.appendChild(row);
      });

      // ── violations ────────────────────────────────────────────────────────
      const viols = diff?.violations || data.violations || [];
      const violSection = $('violation-section');
      const violList    = $('violation-list');
      if (viols.length === 0) {
        violSection.style.display = 'none';
      } else {
        violSection.style.display = 'block';
        violList.innerHTML = '';
        viols.forEach(v => {
          const row = document.createElement('div');
          row.className = 'violation-row v-' + (v.type || '').toLowerCase().replace(/_/g, '-');
          const badge = document.createElement('span');
          badge.className = 'violation-badge';
          badge.textContent = v.type;
          const reason = document.createElement('span');
          reason.className = 'violation-reason';
          reason.textContent = v.reason;
          row.appendChild(badge);
          row.appendChild(reason);
          violList.appendChild(row);
        });
      }
    }

    function driftLevel(score) {
      if (score < 0.2) return { label: 'STABLE',      color: '#4ec94e' };
      if (score < 0.5) return { label: 'MILD',         color: '#d4c94a' };
      if (score < 0.8) return { label: 'STRUCTURAL',   color: '#e08030' };
      return               { label: 'DANGEROUS',   color: '#e05050' };
    }
  </script>
</body>
</html>`;
}

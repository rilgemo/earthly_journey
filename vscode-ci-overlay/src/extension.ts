import * as vscode from 'vscode';
import { startWatcher } from './watcher';

let panel: vscode.WebviewPanel | undefined;

function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
  const htmlPath = vscode.Uri.joinPath(context.extensionUri, 'webview', 'panel.html');
  const graphScriptPath = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'webview', 'graph.js')
  );
  const cssPath = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'webview', 'style.css')
  );

  const fs = require('fs');
  let html: string = fs.readFileSync(htmlPath.fsPath, 'utf-8');
  html = html.replace('{{GRAPH_JS}}', graphScriptPath.toString());
  html = html.replace('{{STYLE_CSS}}', cssPath.toString());
  return html;
}

function createPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
  const p = vscode.window.createWebviewPanel(
    'ciGraph',
    'CI Graph Overlay',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'webview')
      ]
    }
  );

  p.webview.html = getWebviewContent(p.webview, context);
  startWatcher(p);

  p.onDidDispose(() => {
    panel = undefined;
  });

  return p;
}

export function activate(context: vscode.ExtensionContext): void {
  const openCommand = vscode.commands.registerCommand('ciGraph.open', () => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.Two);
    } else {
      panel = createPanel(context);
    }
  });

  context.subscriptions.push(openCommand);

  // Auto-open if latest.json already exists on activation
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    const latestPath = vscode.Uri.joinPath(
      folders[0].uri, 'docs', 'ci', 'graph', 'latest.json'
    );
    vscode.workspace.fs.stat(latestPath).then(
      () => { panel = createPanel(context); },
      () => { /* file doesn't exist yet — wait for command */ }
    );
  }
}

export function deactivate(): void {
  if (panel) panel.dispose();
}

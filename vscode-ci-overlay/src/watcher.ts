import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function resolveArtifactPath(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return path.join(folders[0].uri.fsPath, 'docs', 'ci', 'graph', 'latest.json');
}

function readArtifact(filePath: string): unknown | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function postUpdate(panel: vscode.WebviewPanel, data: unknown): void {
  panel.webview.postMessage({ type: 'UPDATE_GRAPH', data });
}

export function startWatcher(panel: vscode.WebviewPanel): void {
  const filePath = resolveArtifactPath();

  if (!filePath) {
    postUpdate(panel, null);
    return;
  }

  // Send initial state if the file already exists
  const initial = readArtifact(filePath);
  if (initial) {
    postUpdate(panel, initial);
  }

  // Watch for changes — VSCode fs.watch is reliable on Windows for single-file watching
  let watcher: fs.FSWatcher | null = null;

  try {
    watcher = fs.watch(filePath, () => {
      const data = readArtifact(filePath);
      if (data) postUpdate(panel, data);
    });
  } catch {
    // File doesn't exist yet — use VSCode's FileSystemWatcher to wait for creation
    const vsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.workspaceFolders![0],
        'docs/ci/graph/latest.json'
      )
    );

    const onFile = () => {
      vsWatcher.dispose();
      startWatcher(panel); // restart with fs.watch now that file exists
    };

    vsWatcher.onDidCreate(onFile);
    vsWatcher.onDidChange(() => {
      const data = readArtifact(filePath);
      if (data) postUpdate(panel, data);
    });

    panel.onDidDispose(() => vsWatcher.dispose());
    return;
  }

  panel.onDidDispose(() => {
    if (watcher) watcher.close();
  });
}

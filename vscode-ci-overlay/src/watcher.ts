import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CIGraphIR } from './graphParser';
import { computeDiff, CIDiff } from './diffHighlighter';

function resolveArtifactPath(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return path.join(folders[0].uri.fsPath, 'docs', 'ci', 'graph', 'latest.json');
}

function readIR(filePath: string): CIGraphIR | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as CIGraphIR;
  } catch {
    return null;
  }
}

interface WatcherMessage {
  type: 'UPDATE_GRAPH';
  data: {
    current: CIGraphIR;
    diff: CIDiff | null;
  };
}

function postUpdate(panel: vscode.WebviewPanel, current: CIGraphIR, diff: CIDiff | null): void {
  const msg: WatcherMessage = { type: 'UPDATE_GRAPH', data: { current, diff } };
  panel.webview.postMessage(msg);
}

export function startWatcher(panel: vscode.WebviewPanel): void {
  const filePath = resolveArtifactPath();
  if (!filePath) {
    return;
  }

  let prevIR: CIGraphIR | null = null;

  function onFileChanged(): void {
    const current = readIR(filePath!);
    if (!current) return;

    const diff = prevIR ? computeDiff(prevIR, current) : null;
    prevIR = current;
    postUpdate(panel, current, diff);
  }

  // Send initial state if file already exists
  const initial = readIR(filePath);
  if (initial) {
    prevIR = initial;
    postUpdate(panel, initial, null);
  }

  let watcher: fs.FSWatcher | null = null;

  try {
    watcher = fs.watch(filePath, () => onFileChanged());
  } catch {
    // File doesn't exist yet — use VSCode's FileSystemWatcher to wait for creation
    const vsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.workspaceFolders![0],
        'docs/ci/graph/latest.json'
      )
    );

    vsWatcher.onDidCreate(() => {
      vsWatcher.dispose();
      startWatcher(panel);
    });

    vsWatcher.onDidChange(() => onFileChanged());

    panel.onDidDispose(() => vsWatcher.dispose());
    return;
  }

  panel.onDidDispose(() => {
    if (watcher) watcher.close();
  });
}

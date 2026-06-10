"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWatcher = startWatcher;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function resolveArtifactPath() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0)
        return null;
    return path.join(folders[0].uri.fsPath, 'docs', 'ci', 'graph', 'latest.json');
}
function readArtifact(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function postUpdate(panel, data) {
    panel.webview.postMessage({ type: 'UPDATE_GRAPH', data });
}
function startWatcher(panel) {
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
    let watcher = null;
    try {
        watcher = fs.watch(filePath, () => {
            const data = readArtifact(filePath);
            if (data)
                postUpdate(panel, data);
        });
    }
    catch {
        // File doesn't exist yet — use VSCode's FileSystemWatcher to wait for creation
        const vsWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], 'docs/ci/graph/latest.json'));
        const onFile = () => {
            vsWatcher.dispose();
            startWatcher(panel); // restart with fs.watch now that file exists
        };
        vsWatcher.onDidCreate(onFile);
        vsWatcher.onDidChange(() => {
            const data = readArtifact(filePath);
            if (data)
                postUpdate(panel, data);
        });
        panel.onDidDispose(() => vsWatcher.dispose());
        return;
    }
    panel.onDidDispose(() => {
        if (watcher)
            watcher.close();
    });
}
//# sourceMappingURL=watcher.js.map
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const watcher_1 = require("./watcher");
let panel;
function getWebviewContent(webview, context) {
    const htmlPath = vscode.Uri.joinPath(context.extensionUri, 'webview', 'panel.html');
    const graphScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'webview', 'graph.js'));
    const cssPath = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'webview', 'style.css'));
    const fs = require('fs');
    let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');
    html = html.replace('{{GRAPH_JS}}', graphScriptPath.toString());
    html = html.replace('{{STYLE_CSS}}', cssPath.toString());
    return html;
}
function createPanel(context) {
    const p = vscode.window.createWebviewPanel('ciGraph', 'CI Graph Overlay', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, 'webview')
        ]
    });
    p.webview.html = getWebviewContent(p.webview, context);
    (0, watcher_1.startWatcher)(p);
    p.onDidDispose(() => {
        panel = undefined;
    });
    return p;
}
function activate(context) {
    const openCommand = vscode.commands.registerCommand('ciGraph.open', () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.Two);
        }
        else {
            panel = createPanel(context);
        }
    });
    context.subscriptions.push(openCommand);
    // Auto-open if latest.json already exists on activation
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
        const latestPath = vscode.Uri.joinPath(folders[0].uri, 'docs', 'ci', 'graph', 'latest.json');
        vscode.workspace.fs.stat(latestPath).then(() => { panel = createPanel(context); }, () => { });
    }
}
function deactivate() {
    if (panel)
        panel.dispose();
}
//# sourceMappingURL=extension.js.map
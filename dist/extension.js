"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));

// src/outputBuffer.ts
var OutputBuffer = class {
  constructor(delayMs = 1e4, onBatchReady = () => void 0) {
    this.delayMs = delayMs;
    this.onBatchReady = onBatchReady;
  }
  delayMs;
  onBatchReady;
  pending = "";
  latest = "";
  timer;
  append(chunk) {
    if (!chunk) {
      return;
    }
    this.pending += chunk;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }
  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = void 0;
    }
    if (!this.pending) {
      return;
    }
    this.latest = this.pending;
    this.pending = "";
    this.onBatchReady(this.latest);
  }
  get latestBatch() {
    return this.latest;
  }
  get hasPendingOutput() {
    return this.pending.length > 0;
  }
  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = void 0;
    }
    this.pending = "";
    this.latest = "";
  }
  dispose() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = void 0;
    }
  }
};

// src/extension.ts
var ANSI_ESCAPE = /\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g;
function cleanTerminalOutput(chunk) {
  return chunk.replace(ANSI_ESCAPE, "").replace(/\r\n/g, "\n");
}
function activate(context) {
  const output = vscode.window.createOutputChannel(
    "Terminal Output Clipboard"
  );
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  function showEmpty() {
    status.text = "$(circle-slash) No output captured";
    status.tooltip = "No terminal output has been captured yet";
  }
  function showCollecting() {
    status.text = "$(sync~spin) Collecting output...";
    status.tooltip = "Collecting terminal output. The batch becomes ready after 10 seconds of inactivity.";
  }
  function showReady() {
    status.text = "$(clippy) Output ready \u2014 Copy";
    status.tooltip = "Latest terminal output is ready. Click to copy, or press Ctrl+Alt+C.";
  }
  status.command = "terminalOutputClipboard.copyLatest";
  showEmpty();
  status.show();
  const buffer = new OutputBuffer(1e4, showReady);
  context.subscriptions.push(
    output,
    status,
    { dispose: () => buffer.dispose() },
    vscode.commands.registerCommand(
      "terminalOutputClipboard.copyLatest",
      async () => {
        buffer.flush();
        const text = buffer.latestBatch;
        if (!text) {
          showEmpty();
          void vscode.window.showInformationMessage(
            "No terminal output has been captured yet."
          );
          return;
        }
        try {
          await vscode.env.clipboard.writeText(text);
          showReady();
          void vscode.window.showInformationMessage(
            "Latest terminal output copied to clipboard."
          );
        } catch (error) {
          void vscode.window.showErrorMessage(
            `Could not copy terminal output: ${String(error)}`
          );
        }
      }
    ),
    vscode.commands.registerCommand(
      "terminalOutputClipboard.clear",
      () => {
        buffer.clear();
        showEmpty();
        void vscode.window.showInformationMessage(
          "Terminal output buffer cleared."
        );
      }
    ),
    vscode.window.onDidStartTerminalShellExecution((event) => {
      const stream = event.execution.read();
      void (async () => {
        try {
          for await (const chunk of stream) {
            const cleaned = cleanTerminalOutput(chunk);
            if (cleaned) {
              showCollecting();
              buffer.append(cleaned);
              output.append(cleaned);
            }
          }
        } catch (error) {
          output.appendLine(
            `Unable to read terminal output: ${String(error)}`
          );
        }
      })();
    })
  );
  output.appendLine("Terminal Output Clipboard activated.");
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});

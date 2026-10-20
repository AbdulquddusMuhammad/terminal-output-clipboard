import * as vscode from "vscode";
import { OutputBuffer } from "./outputBuffer";

const ANSI_ESCAPE = /\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g;

function cleanTerminalOutput(chunk: string): string {
  return chunk.replace(ANSI_ESCAPE, "").replace(/\r\n/g, "\n");
}

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel("Terminal Output Clipboard");

  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );

  status.command = "terminalOutputClipboard.copyLatest";
  status.text = "$(clippy) Copy Terminal Output";
  status.tooltip = "Copy the latest captured terminal output";
  status.show();

  const buffer = new OutputBuffer(10_000, () => {
    status.text = "$(clippy) Copy Terminal Output";
    status.tooltip = "A terminal output batch is ready to copy";
  });

  context.subscriptions.push(
    output,
    status,
    { dispose: () => buffer.dispose() },

    vscode.commands.registerCommand(
      "terminalOutputClipboard.copyLatest",
      async () => {
        // Flush any output still inside its inactivity window.
        buffer.flush();

        const text = buffer.latestBatch;

        if (!text) {
          void vscode.window.showInformationMessage(
            "No terminal output has been captured yet.",
          );
          return;
        }

        await vscode.env.clipboard.writeText(text);
        void vscode.window.showInformationMessage(
          "Latest terminal output copied to clipboard.",
        );
      },
    ),

    vscode.commands.registerCommand("terminalOutputClipboard.clear", () => {
      buffer.clear();
      status.text = "$(clippy) Copy Terminal Output";
      status.tooltip = "Terminal output buffer cleared";
      void vscode.window.showInformationMessage(
        "Terminal output buffer cleared.",
      );
    }),

    vscode.window.onDidStartTerminalShellExecution((event) => {
      // Start reading immediately so early output is not missed.
      const stream = event.execution.read();

      void (async () => {
        try {
          for await (const chunk of stream) {
            const cleaned = cleanTerminalOutput(chunk);
            if (cleaned) {
              buffer.append(cleaned);
              output.append(cleaned);
            }
          }
        } catch (error) {
          output.appendLine(`Unable to read terminal output: ${String(error)}`);
        }
      })();
    }),
  );

  output.appendLine("Terminal Output Clipboard activated.");
}

export function deactivate(): void {
  // Resources are disposed through the extension context subscriptions.
}

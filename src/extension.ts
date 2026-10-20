
import * as vscode from "vscode";
import { OutputBuffer } from "./outputBuffer";

const ANSI_ESCAPE =
  /\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g;

function cleanTerminalOutput(chunk: string): string {
  return chunk
    .replace(ANSI_ESCAPE, "")
    .replace(/\r\n/g, "\n");
}

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel(
    "Terminal Output Clipboard",
  );

  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );

  function showEmpty(): void {
    status.text = "$(circle-slash) No output captured";
    status.tooltip = "No terminal output has been captured yet";
  }

  function showCollecting(): void {
    status.text = "$(sync~spin) Collecting output...";
    status.tooltip =
      "Collecting terminal output. The batch becomes ready after 10 seconds of inactivity.";
  }

  function showReady(): void {
    status.text = "$(clippy) Output ready — Copy";
    status.tooltip =
      "Latest terminal output is ready. Click to copy, or press Ctrl+Alt+C.";
  }

  status.command = "terminalOutputClipboard.copyLatest";
  showEmpty();
  status.show();

  const buffer = new OutputBuffer(10_000, showReady);

  context.subscriptions.push(
    output,
    status,
    { dispose: () => buffer.dispose() },

    vscode.commands.registerCommand(
      "terminalOutputClipboard.copyLatest",
      async () => {
        // Include output that is still inside its inactivity window.
        buffer.flush();

        const text = buffer.latestBatch;

        if (!text) {
          showEmpty();
          void vscode.window.showInformationMessage(
            "No terminal output has been captured yet.",
          );
          return;
        }

        try {
          await vscode.env.clipboard.writeText(text);
          showReady();
          void vscode.window.showInformationMessage(
            "Latest terminal output copied to clipboard.",
          );
        } catch (error) {
          void vscode.window.showErrorMessage(
            `Could not copy terminal output: ${String(error)}`,
          );
        }
      },
    ),

    vscode.commands.registerCommand(
      "terminalOutputClipboard.clear",
      () => {
        buffer.clear();
        showEmpty();

        void vscode.window.showInformationMessage(
          "Terminal output buffer cleared.",
        );
      },
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
            `Unable to read terminal output: ${String(error)}`,
          );
        }
      })();
    }),
  );

  output.appendLine("Terminal Output Clipboard activated.");
}

export function deactivate(): void {
  // Resources are disposed through the extension context subscriptions.
}

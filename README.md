# Terminal Output Clipboard

A Visual Studio Code extension that collects terminal output into batches and lets you copy the latest batch to your clipboard with one command.

## Features

- **Automatic output collection** — captures terminal output through VS Code shell integration.
- **Smart batching** — combines incoming output and finalizes a batch after 10 seconds of inactivity.
- **One-command copying** — copy the latest captured output without manually selecting text in the terminal.
- **Status bar access** — click **Copy Terminal Output** to copy the latest batch.
- **Clear buffer** — clear the currently stored output using the Command Palette.
- **ANSI cleanup** — removes common ANSI escape sequences from captured output.

## Installation

### Install from a VSIX package

1. Download `terminal-output-clipboard-0.1.0.vsix` from a project's release or obtain it from the project owner.
2. Open Visual Studio Code.
3. Open the Command Palette with `Ctrl+Shift+P`.
4. Run **Extensions: Install from VSIX...**.
5. Select the downloaded `.vsix` file.

Alternatively, install it from a terminal:

```powershell
code --install-extension .\terminal-output-clipboard-0.1.0.vsix
```

## Usage

1. Open a VS Code integrated terminal with shell integration enabled.
2. Run a command that produces output.
3. Wait 10 seconds after the last output for the batch to finish.
4. Click **Copy Terminal Output** in the status bar, or open the Command Palette and run **Terminal Output Clipboard: Copy Latest**.
5. Paste the copied output wherever you need it.

To clear the stored output, run **Terminal Output Clipboard: Clear Buffer** from the Command Palette.

## How batching works

New output is appended to the current pending batch. Each new chunk resets the 10-second inactivity timer. When no new output arrives during that period, the pending text becomes the latest completed batch.

Copying the latest output also flushes any pending text immediately before copying.

## Requirements

- Visual Studio Code 1.108.0 or later, subject to the extension's declared engine compatibility.
- A VS Code integrated terminal where shell integration is available.

## Limitations

- Capture relies on VS Code terminal shell integration; it does not guarantee access to every kind of terminal output.
- Output is held in memory while the extension is running.
- The current implementation maintains one shared output buffer rather than separate buffers for each terminal.

## Development

Install dependencies:

```bash
npm install
```

Compile the extension:

```bash
npm run compile
```

Run the tests:

```bash
npm test
```

Package the extension as a VSIX:

```bash
npx --yes @vscode/vsce package --allow-missing-repository
```

## Project

GitHub: https://github.com/AbdulquddusMuhammad/terminal-output-clipboard

## Contributing

Issues, suggestions, and contributions are welcome. Please open an issue to discuss a substantial change before submitting a pull request.

## License

No license has been specified yet. Until a license is added, others should not assume they have permission to reuse, modify, or redistribute this project's code.

# FLOW Normalizer

Deterministic system-wide orthographic normalization engine.  
Pipeline: **SN → SL → MO → PG** (Syntactic → Syllabic → Morphological → Phoneme-Grapheme).

## Project Structure

```
src/           Core pipeline and rule engine
test/          Unit, integration and debug tests
assets/        Splash screens, tray icons, startup sound
docs/          Design notes and protocol documentation
```

## Quick Start

```bash
# Normalize text via CLI
node src/loom_cli.js "ich hab das gestern gelsen"

# With language flag
node src/loom_cli.js --lang en "i definately dont know"

# Learn an exception
node src/loom_cli.js --learn-exception "teh" "the"
```

## Tests

```bash
npm test                         # All tests
npm run test:unit                # Core normalization + UI binding + learning
npm run test:rules               # Rule debug checks
npm run test:lab                 # Lab integration
npm run test:batch               # Random LRS batch (200 inputs)
npm run debug:rules              # Verbose rule diagnostics
```

## Native Windows App

`FLOW_Normalizer.cs` is a WinForms system-tray application that hooks into
the Windows keyboard pipeline and corrects text in real time via the
Node.js normalization engine.

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (build)
- [Node.js ≥ 18](https://nodejs.org) in PATH (runtime)

### Build

```bash
# Debug
dotnet build FlowNormalizer.csproj

# Release
dotnet build FlowNormalizer.csproj -c Release

# Self-contained single-file EXE
dotnet publish FlowNormalizer.csproj -c Release -r win-x64 \
  --self-contained true -p:PublishSingleFile=true -o publish
```

Or use the build scripts:

```bash
build.bat                 # Windows – Debug
build.bat publish         # Windows – Single-file EXE → publish/
./build.sh publish        # Linux/macOS – Cross-compile → publish/
```

### Troubleshooting

1. Check the tray balloon — the app runs a self-check at startup.
2. Right-click the tray icon → **Status anzeigen** for a quick health overview.
3. Right-click → **Diagnose erneut prüfen** to re-run diagnostics.
4. Open `flow_startup.log` for detailed startup information.
5. Verify `node` is in PATH: `node -v`.
6. Verify `loom_cli.js` + `pipeline.js` are next to the EXE.
7. Manual test: `node src/loom_cli.js "ich hab zeit"`.

## Language Support

| Setting | Description |
|---------|-------------|
| Default | German (`de`) |
| ENV | `FLOW_LANGUAGE=en` |
| CLI | `--lang en` |
| Hotkey | `Ctrl+Alt+Space` toggles DE ↔ EN |
| Preset | `--en-preset en-prose-plus` (optional) |

Learned exceptions are stored per language in `flow_rules.json` under
`languages.de` / `languages.en`.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Windows Native Layer (C#)                      │
│  Keyboard Hook · System Tray · WinForms Dialogs │
└────────────────────┬────────────────────────────┘
                     │ spawns
┌────────────────────▼────────────────────────────┐
│  CLI Wrapper (loom_cli.js)                      │
│  Argument parsing · Learn commands              │
└────────────────────┬────────────────────────────┘
                     │ calls
┌────────────────────▼────────────────────────────┐
│  Pipeline (pipeline.js)                         │
│  Language routing · Learned rules · Correction  │
└────────────────────┬────────────────────────────┘
                     │ delegates
┌────────────────────▼────────────────────────────┐
│  Rule Engine (ruleEngine.js)                    │
│  Protected spans · Context rules                │
│  SN → SL → MO → PG chain · Whitespace norm.    │
└─────────────────────────────────────────────────┘
```

# Changelog

## 0.1.0 — 2026-05-21

Initial Marketplace release.

### Core experience
- Single always-visible **AOJ sidebar** drives compile / run / submit — no separate webview panels open on action.
- Per-case **▶ Run** button on every testcase card.
- Inline `.in` / `.out` editing with commit-on-blur; undo toast on remove.
- Compile artifact cache — Run All compiles once; subsequent per-case runs reuse the artifact until the source changes.
- AOJ color palette: green **Run**, navy **Submit**, verdict-colored card borders matching the web tokens.
- Login is optional — testcase add/edit/run all work without an account.

### Language support
- Language metadata is bundled inside the extension (no network fetch).
- OS-aware compiler commands (e.g. Python uses `python` on Windows and `python3` on Linux/macOS).
- Friendly install-hint message when a compiler is missing (ENOENT), with `aoj.compilerPaths.<lang>` override guidance.
- Supported: C, C++, Python, PyPy, Java, Rust (`--edition=2021`), Go, JavaScript, C# (.NET 10 `dotnet run <file>.cs`), Text.
- Text language compares the source file directly in memory — no spawn needed, works on Windows too.
- Per-language settings override: `aoj.compilerPaths`, `aoj.compileFlags`.

### Submission flow
- Live progress percentage via SSE while judging (`Running 50%`).
- Final verdict + pass/total fetched from the server when judging completes.
- Runtime error verdict shows stdout + stderr together in the *Actual* area.

### Filesystem hygiene
- Testcase files are kept under `<source>/.aoj/<base>_<n>.in/.out` so the source folder stays clean.
- Legacy testcases at `<source>/<base>_<n>.in/.out` are still read (natural migration).
- Build artifacts run from the OS temp directory.

### Compatibility
- `aoj.syncProblemById` remains as an alias of `aoj.attachProblemById`.

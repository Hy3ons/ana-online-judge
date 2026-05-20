# Changelog

## 0.3.0 — 2026-05-21

### Pivot: sidebar-first, login-optional

The extension's core value is now "one-click execution of any testcase, for any source file you have open." AOJ login became optional — testcase add/edit/run all work without an account.

**New**
- Single always-visible **AOJ sidebar** drives compile / run / submit — no more separate panels.
- Per-case **▶ Run** button on every testcase card.
- AOJ color palette: green **Run** button, navy **Submit** button, verdict-colored card borders matching the web verdict tokens.
- Inline `.in` / `.out` editing with commit-on-blur; undo toast on remove.
- Compile artifact cache — Run All compiles once; subsequent per-case runs reuse the artifact until the source changes.
- New settings: `aoj.defaultRunTimeoutMs`, `aoj.dismissSignInBanner`.

**Removed**
- The separate **Problem Statement** webview panel and `aoj.openStatement` command (browse problems on the website).
- The separate **Results** webview panel (folded into the sidebar — no more new tabs opening on Run / Submit).
- Dashboard "Recent Submissions" / "Active Contest" lists (contest countdown stays in the statusbar).
- Dependencies: `markdown-it`, `markdown-it-highlightjs`, `highlight.js`.

**Renamed**
- View id `aoj.dashboard` → `aoj.sidebar`.
- Command `aoj.dashboard.refresh` → `aoj.sidebar.refresh`.

**Compatibility**
- `aoj.syncProblemById` remains as an alias of `aoj.attachProblemById`.
- Existing `.aoj/<basename>.json` sidecars + `.in`/`.out` testcase files keep working.

## 0.1.0 (initial)
- 최초 업로드

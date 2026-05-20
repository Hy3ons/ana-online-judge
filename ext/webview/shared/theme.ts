/**
 * Canonical color token names used by webview components.
 * These map to VSCode theme CSS variables (see tailwind.config.ts).
 * Keep this list in sync with the Tailwind colors block.
 */
export const tokens = {
	bg: "var(--vscode-editor-background)",
	bgElev: "var(--vscode-sideBar-background)",
	bgCard: "var(--vscode-input-background)",
	fg: "var(--vscode-foreground)",
	fgMuted: "var(--vscode-descriptionForeground)",
	border: "var(--vscode-panel-border)",
	accent: "var(--vscode-textLink-foreground)",
	accentBg: "var(--vscode-button-background)",
	accentFg: "var(--vscode-button-foreground)",
	ok: "var(--vscode-testing-iconPassed)",
	bad: "var(--vscode-testing-iconFailed)",
	warn: "var(--vscode-editorWarning-foreground)",
} as const;

export type TokenName = keyof typeof tokens;

/** Resolve a token name to its CSS var() reference. */
export function token(name: TokenName): string {
	return tokens[name];
}

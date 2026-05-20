import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./webview/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				// Map to VSCode theme variables (Aligned style — D4)
				bg: "var(--vscode-editor-background)",
				"bg-elev": "var(--vscode-sideBar-background, var(--vscode-editor-background))",
				"bg-card": "var(--vscode-input-background, var(--vscode-editor-background))",
				fg: "var(--vscode-foreground)",
				"fg-muted": "var(--vscode-descriptionForeground)",
				border: "var(--vscode-panel-border, var(--vscode-widget-border, #2d2d2d))",
				accent: "var(--vscode-textLink-foreground)",
				"accent-bg": "var(--vscode-button-background)",
				"accent-fg": "var(--vscode-button-foreground)",
				"accent-hover": "var(--vscode-button-hoverBackground)",
				ok: "var(--vscode-testing-iconPassed, #2ea043)",
				bad: "var(--vscode-testing-iconFailed, #cf222e)",
				warn: "var(--vscode-editorWarning-foreground, #cca700)",
				info: "var(--vscode-charts-blue, #3794ff)",
				code: "var(--vscode-textCodeBlock-background, rgba(127,127,127,0.1))",
				badge: "var(--vscode-badge-background)",
				"badge-fg": "var(--vscode-badge-foreground)",
			},
			fontFamily: {
				sans: ["var(--vscode-font-family)"],
				mono: ["var(--vscode-editor-font-family)", "monospace"],
			},
			fontSize: {
				xs: ["10px", "1.4"],
				sm: ["11px", "1.4"],
				base: ["13px", "1.5"],
				lg: ["14px", "1.4"],
				xl: ["16px", "1.3"],
			},
		},
	},
	plugins: [],
};

export default config;

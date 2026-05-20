import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./webview/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				// Chrome: theme-aware (follows user's VSCode theme)
				bg: "var(--vscode-editor-background)",
				"bg-elev": "var(--vscode-sideBar-background, var(--vscode-editor-background))",
				"bg-card": "var(--vscode-input-background, var(--vscode-editor-background))",
				fg: "var(--vscode-foreground)",
				"fg-muted": "var(--vscode-descriptionForeground)",
				border: "var(--vscode-panel-border, var(--vscode-widget-border, #2d2d2d))",
				code: "var(--vscode-textCodeBlock-background, rgba(127,127,127,0.1))",

				// Actions: AOJ palette
				primary: "var(--aoj-primary)",
				"primary-fg": "var(--aoj-primary-fg)",
				accent: "var(--aoj-accent)",
				"accent-fg": "var(--aoj-accent-fg)",
				ok: "var(--verdict-accepted)",
				"ok-bg": "var(--verdict-accepted-bg)",
				bad: "var(--verdict-wrong)",
				"bad-bg": "var(--verdict-wrong-bg)",

				// Verdict palette (full)
				"verdict-ac": "var(--verdict-accepted)",
				"verdict-ac-bg": "var(--verdict-accepted-bg)",
				"verdict-wa": "var(--verdict-wrong)",
				"verdict-wa-bg": "var(--verdict-wrong-bg)",
				"verdict-tle": "var(--verdict-tle)",
				"verdict-tle-bg": "var(--verdict-tle-bg)",
				"verdict-mle": "var(--verdict-mle)",
				"verdict-mle-bg": "var(--verdict-mle-bg)",
				"verdict-re": "var(--verdict-runtime)",
				"verdict-re-bg": "var(--verdict-runtime-bg)",
				"verdict-ce": "var(--verdict-compile)",
				"verdict-ce-bg": "var(--verdict-compile-bg)",
				"verdict-pending": "var(--verdict-pending)",
				"verdict-pending-bg": "var(--verdict-pending-bg)",
				"verdict-skipped": "var(--verdict-skipped)",
				"verdict-skipped-bg": "var(--verdict-skipped-bg)",
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
			borderWidth: { 4: "4px" },
		},
	},
	plugins: [],
};

export default config;

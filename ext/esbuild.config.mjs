import { build, context } from "esbuild";

const isWatch = process.argv.includes("--watch");
const isProd = process.argv.includes("--production");

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
	entryPoints: ["src/extension.ts"],
	bundle: true,
	outfile: "dist/extension.js",
	platform: "node",
	target: "node20",
	format: "cjs",
	external: ["vscode"],
	sourcemap: !isProd,
	minify: isProd,
	logLevel: "info",
};

/** @type {import('esbuild').BuildOptions} */
const sharedWebviewOpts = {
	bundle: true,
	platform: "browser",
	target: "es2022",
	format: "iife",
	sourcemap: !isProd,
	minify: isProd,
	logLevel: "info",
	jsx: "automatic",
	jsxImportSource: "preact",
	loader: { ".css": "empty" },
};

const sidebarConfig = {
	...sharedWebviewOpts,
	entryPoints: ["webview/sidebar/index.tsx"],
	outfile: "dist/webview/sidebar.js",
};
const resultsConfig = {
	...sharedWebviewOpts,
	entryPoints: ["webview/results/index.tsx"],
	outfile: "dist/webview/results.js",
};
const statementConfig = {
	...sharedWebviewOpts,
	entryPoints: ["webview/statement/index.tsx"],
	outfile: "dist/webview/statement.js",
};

async function run() {
	const configs = [extensionConfig, sidebarConfig, resultsConfig, statementConfig];
	if (isWatch) {
		const ctxs = await Promise.all(configs.map((c) => context(c)));
		await Promise.all(ctxs.map((c) => c.watch()));
		console.log("watching...");
	} else {
		for (const c of configs) await build(c);
	}
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});

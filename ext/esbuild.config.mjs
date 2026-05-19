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
const webviewConfig = {
	entryPoints: ["media/results.js"],
	bundle: true,
	outfile: "dist/webview/results.js",
	platform: "browser",
	target: "es2022",
	format: "iife",
	sourcemap: !isProd,
	minify: isProd,
	logLevel: "info",
};

async function run() {
	if (isWatch) {
		const ext = await context(extensionConfig);
		const web = await context(webviewConfig);
		await Promise.all([ext.watch(), web.watch()]);
		console.log("watching...");
	} else {
		await build(extensionConfig);
		await build(webviewConfig);
	}
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});

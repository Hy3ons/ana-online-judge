// The `markdown-it-highlightjs/core` subpath ships its types under
// `types/core.d.ts` without a top-level declaration. Redirect the subpath
// import to the actual declaration so we can use a normal ESM import while
// still benefiting from the bundle-trimming `core` entry point.
declare module "markdown-it-highlightjs/core" {
	export * from "markdown-it-highlightjs/types/core.js";
	export { default } from "markdown-it-highlightjs/types/core.js";
}

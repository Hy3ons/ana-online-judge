import { describe, expect, it } from "vitest";
import { renderMarkdownToHtml } from "../../src/webview/statement/render";

describe("renderMarkdownToHtml", () => {
	it("renders fenced code", () => {
		const html = renderMarkdownToHtml("```\nhi\n```\n");
		expect(html).toMatch(/<pre><code/);
	});
	it("renders headings", () => {
		expect(renderMarkdownToHtml("# Title")).toMatch(/<h1>Title<\/h1>/);
	});
	it("auto-detects code language for highlighting", () => {
		const html = renderMarkdownToHtml("```python\nprint(1)\n```");
		expect(html).toMatch(/hljs/);
	});
});

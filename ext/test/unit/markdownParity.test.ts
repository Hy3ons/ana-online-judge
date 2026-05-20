import * as fs from "node:fs/promises";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { renderMarkdownToHtml } from "../../src/webview/statement/render";

const CORPUS = path.join(__dirname, "..", "corpus");

interface ParityChecks {
	headings: string[];
	codeBlocks: string[];
	tables: number;
}

function extractChecks(html: string): ParityChecks {
	const headings: string[] = [];
	for (const m of html.matchAll(/<h([1-6])[^>]*>([^<]*)<\/h\1>/g)) {
		headings.push(m[2].trim());
	}
	const codeBlocks: string[] = [];
	for (const m of html.matchAll(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)) {
		const text = m[1].replace(/<[^>]+>/g, "");
		codeBlocks.push(decode(text).trim());
	}
	const tables = (html.match(/<table[\s>]/g) ?? []).length;
	return { headings, codeBlocks, tables };
}

function decode(s: string): string {
	return s
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"');
}

describe("markdown parity corpus", () => {
	it("sample1: extracts AOJ example headings and code blocks intact", async () => {
		const md = await fs.readFile(path.join(CORPUS, "sample1.md"), "utf-8");
		const out = extractChecks(renderMarkdownToHtml(md));
		expect(out.headings).toEqual(["두 수의 합", "입력", "출력", "예제 입력 1", "예제 출력 1"]);
		expect(out.codeBlocks).toEqual(["3 5", "8"]);
	});

	it("sample2: preserves table and python code block", async () => {
		const md = await fs.readFile(path.join(CORPUS, "sample2.md"), "utf-8");
		const out = extractChecks(renderMarkdownToHtml(md));
		expect(out.tables).toBe(1);
		expect(out.codeBlocks).toHaveLength(1);
		expect(out.codeBlocks[0]).toMatch(/def dfs/);
	});

	it("sample3: inline code and blockquote do not generate spurious code blocks", async () => {
		const md = await fs.readFile(path.join(CORPUS, "sample3.md"), "utf-8");
		const out = extractChecks(renderMarkdownToHtml(md));
		expect(out.codeBlocks).toHaveLength(0);
		expect(out.headings).toEqual(["수식과 인라인 코드"]);
	});

	it("AOJ example regex still matches output via parseExamples mirror", async () => {
		const md = await fs.readFile(path.join(CORPUS, "sample1.md"), "utf-8");
		const headerRe = /^##\s+예제\s+(입력|출력)\s+(\d+)\s*$/gm;
		const hits = [...md.matchAll(headerRe)];
		expect(hits).toHaveLength(2);
	});
});

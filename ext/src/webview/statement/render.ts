import MarkdownIt from "markdown-it";
import hljsPlugin from "markdown-it-highlightjs";

export interface RenderOptions {
	/** CSP nonce for any inline scripts (not currently emitted, but reserved). */
	nonce?: string;
}

let md: MarkdownIt | null = null;

function getMd(): MarkdownIt {
	if (md) return md;
	md = new MarkdownIt({
		html: false,
		linkify: true,
		breaks: false,
		typographer: false,
	}).use(hljsPlugin, { auto: true, code: true });
	return md;
}

export function renderMarkdownToHtml(markdown: string, _opts: RenderOptions = {}): string {
	return getMd().render(markdown);
}

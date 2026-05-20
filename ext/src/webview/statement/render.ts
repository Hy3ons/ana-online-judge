import hljs from "highlight.js/lib/core";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import MarkdownIt from "markdown-it";
import hljsCore from "markdown-it-highlightjs/core";

hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("rust", rust);

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
	}).use(hljsCore, { hljs, auto: true, code: true });
	return md;
}

export function renderMarkdownToHtml(markdown: string, _opts: RenderOptions = {}): string {
	return getMd().render(markdown);
}

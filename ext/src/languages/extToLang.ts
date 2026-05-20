const EXT_MAP: Record<string, string> = {
	".cpp": "cpp",
	".cc": "cpp",
	".cxx": "cpp",
	".c": "c",
	".py": "python",
	".rs": "rust",
	".go": "go",
	".java": "java",
	".js": "javascript",
	".mjs": "javascript",
	".cs": "csharp",
	".txt": "text",
};

/** Map a file path/extension to canonical AOJ language id, or null. */
export function extToLang(filePathOrExt: string): string | null {
	const idx = filePathOrExt.lastIndexOf(".");
	if (idx < 0) return null;
	const ext = filePathOrExt.slice(idx).toLowerCase();
	return EXT_MAP[ext] ?? null;
}

/** Inverse: language id → preferred file extension. */
export function langToExt(lang: string): string | null {
	switch (lang) {
		case "cpp":
			return ".cpp";
		case "c":
			return ".c";
		case "python":
			return ".py";
		case "pypy":
			return ".py";
		case "rust":
			return ".rs";
		case "go":
			return ".go";
		case "java":
			return ".java";
		case "javascript":
			return ".js";
		case "csharp":
			return ".cs";
		case "text":
			return ".txt";
		default:
			return null;
	}
}

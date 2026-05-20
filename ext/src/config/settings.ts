import * as vscode from "vscode";

export function getEndpoint(): string {
	return vscode.workspace
		.getConfiguration("aoj")
		.get<string>("endpoint", "https://aoj.example.com");
}

export function getCompilerPath(lang: string): string | undefined {
	return vscode.workspace.getConfiguration("aoj").get<Record<string, string>>("compilerPaths", {})[
		lang
	];
}

export function getCompileFlags(lang: string): string[] {
	return (
		vscode.workspace.getConfiguration("aoj").get<Record<string, string[]>>("compileFlags", {})[
			lang
		] ?? []
	);
}

export function getTimeoutMultiplier(): number {
	return vscode.workspace.getConfiguration("aoj").get<number>("timeoutMultiplier", 2.0);
}

export function getConfirmSubmit(): boolean {
	return vscode.workspace.getConfiguration("aoj").get<boolean>("confirmSubmit", true);
}

export function getSidecarDir(): string {
	return vscode.workspace.getConfiguration("aoj").get<string>("testcaseSidecarDir", ".aoj");
}

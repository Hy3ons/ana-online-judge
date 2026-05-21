import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { CompileOutput, RunOptions } from "../runner/runner";
import { spawnWithTimeout } from "../runner/spawn";

/**
 * Build the minimal csproj XML used to compile a single Main.cs into an
 * executable .NET 10 program. Kept as a pure function for testability.
 */
export function buildCSharpCsproj(): string {
	return [
		'<Project Sdk="Microsoft.NET.Sdk">',
		"  <PropertyGroup>",
		"    <OutputType>Exe</OutputType>",
		"    <TargetFramework>net10.0</TargetFramework>",
		"    <LangVersion>latest</LangVersion>",
		"    <Nullable>enable</Nullable>",
		"    <RootNamespace>AojRun</RootNamespace>",
		"  </PropertyGroup>",
		"</Project>",
	].join("\n");
}

/**
 * Compile a single .cs file by creating a temp directory, dropping Main.cs
 * and Main.csproj, then invoking `dotnet build -c Release`.
 *
 * The produced DLL lives at <tmp>/bin/Release/net10.0/Main.dll; runner.ts
 * already substitutes {srcDir} when constructing the run command.
 */
export async function compileCSharp(sourcePath: string, opts: RunOptions): Promise<CompileOutput> {
	const tmp = opts.workspaceTmpDir ?? (await fs.mkdtemp(path.join(os.tmpdir(), "aoj-cs-")));
	await fs.mkdir(tmp, { recursive: true });
	const sourceFile = "Main.cs";
	const stagedSrc = path.join(tmp, sourceFile);
	await fs.copyFile(sourcePath, stagedSrc);
	await fs.writeFile(path.join(tmp, "Main.csproj"), buildCSharpCsproj());

	const r = await spawnWithTimeout({
		cmd: "dotnet",
		args: ["build", tmp, "-c", "Release", "--nologo", "-v", "quiet"],
		cwd: tmp,
		timeoutMs: 60_000,
	});

	if (r.errorCode === "ENOENT") {
		return {
			ok: false,
			message:
				"❌ dotnet SDK를 찾을 수 없습니다.\n" +
				"\n" +
				"설치: https://dotnet.microsoft.com/download (.NET 10 SDK)\n" +
				"\n" +
				"또는 설정에서 경로 지정:\n" +
				'  aoj.compilerPaths.csharp = "/path/to/dotnet"',
			artifactDir: tmp,
			sourceFile,
		};
	}
	if (r.exitCode === 0) {
		const exe = path.join(tmp, "bin", "Release", "net10.0", "Main.dll");
		return { ok: true, message: r.stdout + r.stderr, artifactDir: tmp, sourceFile, exe };
	}
	return {
		ok: false,
		message: r.stderr || r.stdout || `dotnet build failed (exit ${r.exitCode})`,
		artifactDir: tmp,
		sourceFile,
	};
}

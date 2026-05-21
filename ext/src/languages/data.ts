/**
 * Static language table — single source of truth for the extension.
 *
 * Mirrors judge/files/languages.toml but with cross-platform abstractions:
 * - Platform-specific commands declared as { linux, darwin, win32 } maps
 * - Placeholders: {src}, {exe}, {srcDir}, {className}
 * - {exe} resolution: runner.ts appends ".exe" on Windows
 *
 * When judge/files/languages.toml changes (language added/removed/command changed),
 * this file MUST be updated to keep judge and extension in sync.
 */

export type PlatformKey = "linux" | "darwin" | "win32";
export interface Cmd {
	command: string;
	args: string[];
}
export type PlatformCmd = Cmd | Partial<Record<PlatformKey, Cmd>>;

export interface LanguageDef {
	id: string;
	displayName: string;
	aliases: string[];
	fileExtensions: string[];
	defaultExtension: string;
	sourceFile: string;
	judgeVersion: string;
	compile?: PlatformCmd;
	run?: PlatformCmd;
	installHints?: Partial<Record<PlatformKey, string>>;
	timeMultiplier: number;
	timeAddSec: number;
	memoryMultiplier: number;
	memoryAddMb: number;
	/** Special runtime; undefined means the standard compile/spawn flow. */
	runtime?: "text" | "csharp";
}

const CC_INSTALL: Partial<Record<PlatformKey, string>> = {
	linux: "sudo apt install build-essential",
	darwin: "xcode-select --install",
	win32: "MSYS2 (https://msys2.org) → pacman -S mingw-w64-x86_64-toolchain",
};

export const LANGUAGES: LanguageDef[] = [
	{
		id: "c",
		displayName: "C",
		aliases: ["c"],
		fileExtensions: ["c"],
		defaultExtension: "c",
		sourceFile: "Main.c",
		judgeVersion: "GCC 12.2.0, C17",
		compile: {
			command: "gcc",
			args: ["-o", "{exe}", "{src}", "-O2", "-Wall", "-lm", "-std=c17", "-DONLINE_JUDGE"],
		},
		run: { command: "{exe}", args: [] },
		installHints: CC_INSTALL,
		timeMultiplier: 1,
		timeAddSec: 0,
		memoryMultiplier: 1,
		memoryAddMb: 0,
	},
	{
		id: "cpp",
		displayName: "C++",
		aliases: ["cpp", "c++", "cpp17", "cpp20"],
		fileExtensions: ["cpp", "cc", "cxx"],
		defaultExtension: "cpp",
		sourceFile: "Main.cpp",
		judgeVersion: "GCC 12.2.0, C++20",
		compile: {
			command: "g++",
			args: ["-o", "{exe}", "{src}", "-O2", "-Wall", "-lm", "-std=c++20", "-DONLINE_JUDGE"],
		},
		run: { command: "{exe}", args: [] },
		installHints: CC_INSTALL,
		timeMultiplier: 1,
		timeAddSec: 0,
		memoryMultiplier: 1,
		memoryAddMb: 0,
	},
	{
		id: "python",
		displayName: "Python",
		aliases: ["python", "python3", "py"],
		fileExtensions: ["py"],
		defaultExtension: "py",
		sourceFile: "Main.py",
		judgeVersion: "Python 3.11.2",
		run: {
			linux: { command: "python3", args: ["-W", "ignore", "{src}"] },
			darwin: { command: "python3", args: ["-W", "ignore", "{src}"] },
			win32: { command: "python", args: ["-W", "ignore", "{src}"] },
		},
		installHints: {
			linux: "sudo apt install python3",
			darwin: "brew install python3 (or use python.org installer)",
			win32: "https://www.python.org/downloads/",
		},
		timeMultiplier: 3,
		timeAddSec: 2,
		memoryMultiplier: 2,
		memoryAddMb: 32,
	},
	{
		id: "pypy",
		displayName: "PyPy",
		aliases: ["pypy", "pypy3"],
		fileExtensions: ["py"],
		defaultExtension: "py",
		sourceFile: "Main.py",
		judgeVersion: "PyPy3 7.3",
		run: { command: "pypy3", args: ["-W", "ignore", "{src}"] },
		installHints: {
			linux: "sudo apt install pypy3",
			darwin: "brew install pypy3",
			win32: "https://www.pypy.org/download.html",
		},
		timeMultiplier: 2,
		timeAddSec: 1,
		memoryMultiplier: 2,
		memoryAddMb: 64,
	},
	{
		id: "java",
		displayName: "Java",
		aliases: ["java"],
		fileExtensions: ["java"],
		defaultExtension: "java",
		sourceFile: "Main.java",
		judgeVersion: "OpenJDK 17",
		compile: { command: "javac", args: ["-encoding", "UTF-8", "{src}"] },
		// -XX:+UseSerialGC removed (judge-only memory-stability hint, not relevant locally)
		run: {
			command: "java",
			args: [
				"-Xms128m",
				"-Xmx512m",
				"-Xss64m",
				"-Dfile.encoding=UTF-8",
				"-cp",
				"{srcDir}",
				"{className}",
			],
		},
		installHints: {
			linux: "sudo apt install openjdk-17-jdk",
			darwin: "brew install openjdk@17",
			win32: "https://adoptium.net/temurin/releases/?version=17",
		},
		timeMultiplier: 2,
		timeAddSec: 1,
		memoryMultiplier: 2,
		memoryAddMb: 16,
	},
	{
		id: "rust",
		displayName: "Rust",
		aliases: ["rust", "rs"],
		fileExtensions: ["rs"],
		defaultExtension: "rs",
		sourceFile: "Main.rs",
		judgeVersion: "Rust 1.91.1",
		// --edition=2021 — judge/files/languages.toml update lands in plan Task 11
		compile: {
			command: "rustc",
			args: ["-O", "--edition=2021", "-o", "{exe}", "{src}"],
		},
		run: { command: "{exe}", args: [] },
		installHints: {
			linux: "https://rustup.rs",
			darwin: "https://rustup.rs",
			win32: "https://rustup.rs",
		},
		timeMultiplier: 1,
		timeAddSec: 0,
		memoryMultiplier: 1,
		memoryAddMb: 0,
	},
	{
		id: "go",
		displayName: "Go",
		aliases: ["go", "golang"],
		fileExtensions: ["go"],
		defaultExtension: "go",
		sourceFile: "Main.go",
		judgeVersion: "Go 1.19.8",
		compile: { command: "go", args: ["build", "-o", "{exe}", "{src}"] },
		run: { command: "{exe}", args: [] },
		installHints: {
			linux: "https://go.dev/dl/",
			darwin: "brew install go (or https://go.dev/dl/)",
			win32: "https://go.dev/dl/",
		},
		timeMultiplier: 1,
		timeAddSec: 0,
		memoryMultiplier: 1,
		memoryAddMb: 0,
	},
	{
		id: "javascript",
		displayName: "JavaScript",
		aliases: ["javascript", "js", "node", "nodejs"],
		fileExtensions: ["js", "mjs"],
		defaultExtension: "js",
		sourceFile: "Main.js",
		judgeVersion: "Node.js 18.20.4",
		run: { command: "node", args: ["{src}"] },
		installHints: {
			linux: "sudo apt install nodejs",
			darwin: "brew install node",
			win32: "https://nodejs.org/",
		},
		timeMultiplier: 3,
		timeAddSec: 2,
		memoryMultiplier: 2,
		memoryAddMb: 32,
	},
	{
		id: "csharp",
		displayName: "C#",
		aliases: ["csharp", "cs", "c#", "dotnet"],
		fileExtensions: ["cs"],
		defaultExtension: "cs",
		sourceFile: "Main.cs",
		judgeVersion: ".NET 10 (C# 14)",
		// Special runtime — csharpRunner.ts generates a temporary .csproj and runs dotnet build.
		// No compile/run commands here; csharpRunner.ts owns the entire flow.
		installHints: {
			linux: "https://dotnet.microsoft.com/download (.NET 10 SDK)",
			darwin: "https://dotnet.microsoft.com/download (.NET 10 SDK)",
			win32: "https://dotnet.microsoft.com/download (.NET 10 SDK)",
		},
		timeMultiplier: 2,
		timeAddSec: 1,
		memoryMultiplier: 2,
		memoryAddMb: 32,
		runtime: "csharp",
	},
	{
		id: "text",
		displayName: "Text",
		aliases: ["text", "txt"],
		fileExtensions: ["txt"],
		defaultExtension: "txt",
		sourceFile: "Main.txt",
		judgeVersion: "",
		// Special runtime — textRunner.ts skips spawn and compares source content directly.
		// No run command needed.
		timeMultiplier: 1,
		timeAddSec: 0,
		memoryMultiplier: 1,
		memoryAddMb: 0,
		runtime: "text",
	},
];

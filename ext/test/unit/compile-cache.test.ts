import { beforeEach, describe, expect, it } from "vitest";
import { CompileCache } from "../../src/runner/compileCache";

describe("CompileCache", () => {
	let cache: CompileCache;
	beforeEach(() => {
		cache = new CompileCache();
	});

	it("returns null on miss", () => {
		expect(cache.get("/path/a.cpp", "hash-a")).toBeNull();
	});

	it("returns stored output on hit (same hash)", () => {
		cache.set("/path/a.cpp", "hash-a", {
			ok: true,
			message: "",
			artifactDir: "/tmp/a",
			sourceFile: "Main.cpp",
			exe: "/tmp/a/Main",
		});
		const got = cache.get("/path/a.cpp", "hash-a");
		expect(got?.exe).toBe("/tmp/a/Main");
	});

	it("returns null when hash differs (content changed)", () => {
		cache.set("/path/a.cpp", "hash-a", {
			ok: true,
			message: "",
			artifactDir: "/tmp/a",
			sourceFile: "Main.cpp",
		});
		expect(cache.get("/path/a.cpp", "hash-b")).toBeNull();
	});

	it("invalidate(path) drops the entry", () => {
		cache.set("/path/a.cpp", "hash-a", {
			ok: true,
			message: "",
			artifactDir: "/tmp/a",
			sourceFile: "Main.cpp",
		});
		cache.invalidate("/path/a.cpp");
		expect(cache.get("/path/a.cpp", "hash-a")).toBeNull();
	});

	it("hashContent yields stable sha1 hex", () => {
		const h1 = CompileCache.hashContent("hello\n");
		const h2 = CompileCache.hashContent("hello\n");
		expect(h1).toEqual(h2);
		expect(h1).toHaveLength(40);
	});

	it("hashContent differs when input differs", () => {
		expect(CompileCache.hashContent("a")).not.toEqual(CompileCache.hashContent("b"));
	});
});

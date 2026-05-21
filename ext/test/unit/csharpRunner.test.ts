import { describe, expect, it } from "vitest";
import { buildCSharpCsproj } from "../../src/languages/csharpRunner";

describe("buildCSharpCsproj", () => {
	it("returns a csproj with Exe OutputType and net10.0 TargetFramework", () => {
		const xml = buildCSharpCsproj();
		expect(xml).toContain("<OutputType>Exe</OutputType>");
		expect(xml).toContain("<TargetFramework>net10.0</TargetFramework>");
		expect(xml).toContain('Sdk="Microsoft.NET.Sdk"');
	});

	it("enables nullable and latest LangVersion", () => {
		const xml = buildCSharpCsproj();
		expect(xml).toContain("<Nullable>enable</Nullable>");
		expect(xml).toContain("<LangVersion>latest</LangVersion>");
	});
});

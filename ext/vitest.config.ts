import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/unit/**/*.test.ts"],
		environment: "node",
		coverage: {
			enabled: false,
			reporter: ["text", "html"],
		},
	},
});

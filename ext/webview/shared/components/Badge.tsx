import type { ComponentChildren } from "preact";

type Variant = "ok" | "bad" | "warn" | "info" | "pending" | "neutral";

const variantClass: Record<Variant, string> = {
	ok: "bg-ok text-white",
	bad: "bg-bad text-white",
	warn: "bg-warn text-black",
	info: "bg-info text-white",
	pending: "bg-badge text-badge-fg",
	neutral: "bg-bg-elev text-fg-muted",
};

const verdictToVariant: Record<string, Variant> = {
	AC: "ok",
	Passed: "ok",
	WA: "bad",
	"Wrong Answer": "bad",
	TLE: "warn",
	Timeout: "warn",
	MLE: "warn",
	RTE: "bad",
	"Runtime Error": "bad",
	CE: "neutral",
	"Compile Error": "neutral",
	PE: "warn",
	Pending: "pending",
	Judging: "pending",
};

export function Badge({
	children,
	variant,
	verdict,
}: {
	children: ComponentChildren;
	variant?: Variant;
	verdict?: string;
}) {
	const v = variant ?? (verdict ? (verdictToVariant[verdict] ?? "neutral") : "neutral");
	return (
		<span class={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${variantClass[v]}`}>
			{children}
		</span>
	);
}

interface Props {
	state: "running" | "error";
	message?: string;
}

export function CompileBanner({ state, message }: Props) {
	if (state === "running") {
		return (
			<div class="mx-3 mt-2 p-2 rounded border border-border bg-bg-elev text-xs text-fg-muted">
				Compiling…
			</div>
		);
	}
	return (
		<div class="mx-3 mt-2 p-2 rounded border-l-4 border-l-verdict-ce border border-border bg-verdict-ce-bg">
			<div class="text-xs font-medium text-verdict-ce mb-1">Compile error</div>
			<pre class="font-mono text-xs text-fg whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
				{message || "(no compiler output)"}
			</pre>
		</div>
	);
}

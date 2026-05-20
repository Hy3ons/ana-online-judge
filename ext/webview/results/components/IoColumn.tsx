export function IoColumn({
	label,
	value,
	diff,
}: {
	label: string;
	value: string;
	diff?: boolean;
}) {
	return (
		<div
			class={`flex-1 p-3 border-r border-border last:border-r-0 ${
				diff ? "bg-bad/10" : ""
			}`}
		>
			<p class="text-xs uppercase tracking-wider text-fg-muted mb-1">{label}</p>
			<pre class="m-0 text-xs whitespace-pre-wrap break-all text-fg">{value}</pre>
		</div>
	);
}

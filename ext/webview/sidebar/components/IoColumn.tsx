import { useEffect, useState } from "preact/hooks";

interface Props {
	label: string;
	value: string;
	editable?: boolean;
	onCommit?: (next: string) => void;
}

export function IoColumn({ label, value, editable, onCommit }: Props) {
	const [draft, setDraft] = useState(value);
	useEffect(() => setDraft(value), [value]);

	if (!editable) {
		return (
			<div class="min-w-0">
				<div class="text-xs text-fg-muted mb-1">{label}</div>
				<pre class="font-mono text-xs bg-bg-card p-2 rounded border border-border overflow-x-auto whitespace-pre min-h-[2.5em]">{value || " "}</pre>
			</div>
		);
	}

	return (
		<div class="min-w-0">
			<div class="text-xs text-fg-muted mb-1">{label}</div>
			<textarea
				class="w-full font-mono text-xs bg-bg-card p-2 rounded border border-border resize-y min-h-[3em]"
				value={draft}
				onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
				onBlur={() => draft !== value && onCommit?.(draft)}
				spellcheck={false}
			/>
		</div>
	);
}

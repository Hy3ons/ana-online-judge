import { useEffect, useRef, useState } from "preact/hooks";

export function IoColumn({
	label,
	value,
	diff,
	editable,
	onCommit,
}: {
	label: string;
	value: string;
	diff?: boolean;
	editable?: boolean;
	onCommit?: (next: string) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);
	const [dirty, setDirty] = useState(false);
	const taRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		if (!editing) setDraft(value);
	}, [value, editing]);

	function commit() {
		setEditing(false);
		if (dirty && onCommit) {
			onCommit(draft);
		}
		setDirty(false);
	}

	function autoSize(el: HTMLTextAreaElement) {
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}

	return (
		<div
			class={`flex-1 p-3 border-r border-border last:border-r-0 ${
				diff ? "bg-bad/10" : ""
			} ${editable ? "cursor-text" : ""}`}
			onClick={() => {
				if (editable && !editing) {
					setEditing(true);
					setDraft(value);
					queueMicrotask(() => {
						if (taRef.current) {
							taRef.current.focus();
							autoSize(taRef.current);
						}
					});
				}
			}}
		>
			<p class="flex items-center gap-1 text-xs uppercase tracking-wider text-fg-muted mb-1">
				<span class="flex-1">{label}</span>
				{dirty && <span class="text-accent text-xs">•</span>}
			</p>
			{editing ? (
				<textarea
					ref={taRef}
					value={draft}
					onInput={(e) => {
						const next = (e.currentTarget as HTMLTextAreaElement).value;
						setDraft(next);
						setDirty(next !== value);
						autoSize(e.currentTarget as HTMLTextAreaElement);
					}}
					onBlur={commit}
					onKeyDown={(e) => {
						if ((e.metaKey || e.ctrlKey) && e.key === "s") {
							e.preventDefault();
							commit();
						}
					}}
					class="w-full text-xs font-mono leading-tight resize-none bg-transparent border-0 outline-none p-0"
				/>
			) : (
				<pre class="m-0 text-xs whitespace-pre-wrap break-all text-fg">{value}</pre>
			)}
		</div>
	);
}

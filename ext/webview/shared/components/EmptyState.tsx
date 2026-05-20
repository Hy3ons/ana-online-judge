import type { ComponentChildren } from "preact";

export function EmptyState({
	title,
	hint,
	action,
}: {
	title: string;
	hint?: ComponentChildren;
	action?: ComponentChildren;
}) {
	return (
		<div class="flex flex-col items-center justify-center text-center py-8 px-4 gap-2">
			<p class="text-fg-muted text-sm">{title}</p>
			{hint && <p class="text-fg-muted text-xs">{hint}</p>}
			{action && <div class="mt-2">{action}</div>}
		</div>
	);
}

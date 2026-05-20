import { useEffect, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";

export interface ToastProps {
	message: ComponentChildren;
	durationMs?: number;
	actionLabel?: string;
	onAction?: () => void;
	onDismiss: () => void;
}

export function Toast({
	message,
	durationMs = 5000,
	actionLabel,
	onAction,
	onDismiss,
}: ToastProps) {
	const [remaining, setRemaining] = useState(durationMs);

	useEffect(() => {
		if (remaining <= 0) {
			onDismiss();
			return;
		}
		const t = setTimeout(() => setRemaining(remaining - 250), 250);
		return () => clearTimeout(t);
	}, [remaining, onDismiss]);

	const pct = Math.max(0, (remaining / durationMs) * 100);

	return (
		<div class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-bg-elev border border-border rounded-md shadow-lg overflow-hidden min-w-[280px] max-w-[480px]">
			<div class="flex items-center gap-3 px-4 py-3">
				<span class="flex-1 text-sm text-fg">{message}</span>
				{actionLabel && onAction && (
					<button
						type="button"
						class="text-accent text-sm font-semibold hover:underline"
						onClick={() => {
							onAction();
							onDismiss();
						}}
					>
						{actionLabel}
					</button>
				)}
			</div>
			<div
				class="h-0.5 bg-accent transition-all duration-200 ease-linear"
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

import type { ComponentChildren, JSX } from "preact";

export function IconButton({
	children,
	onClick,
	title,
	disabled = false,
}: {
	children: ComponentChildren;
	onClick?: JSX.MouseEventHandler<HTMLButtonElement>;
	title?: string;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			title={title}
			class="inline-flex items-center justify-center w-6 h-6 rounded text-fg-muted hover:text-fg hover:bg-bg-elev disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{children}
		</button>
	);
}

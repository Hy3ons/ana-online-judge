import type { ComponentChildren, JSX } from "preact";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClass: Record<Variant, string> = {
	primary: "bg-accent-bg text-accent-fg hover:bg-accent-hover",
	secondary: "bg-bg-elev text-fg border border-border hover:bg-bg-card",
	ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-bg-elev",
	danger: "bg-transparent text-bad border border-border hover:bg-bad/10",
};

export function Button({
	children,
	variant = "primary",
	onClick,
	disabled = false,
	title,
}: {
	children: ComponentChildren;
	variant?: Variant;
	onClick?: JSX.MouseEventHandler<HTMLButtonElement>;
	disabled?: boolean;
	title?: string;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			title={title}
			class={`px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass[variant]}`}
		>
			{children}
		</button>
	);
}

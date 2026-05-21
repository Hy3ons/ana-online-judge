import type { ComponentChildren } from "preact";

export function Card({
	children,
	class: cls,
}: {
	children: ComponentChildren;
	class?: string;
}) {
	return (
		<section
			class={`bg-bg-card border border-border rounded-md overflow-hidden ${cls ?? ""}`}
		>
			{children}
		</section>
	);
}

export function CardHeader({ children }: { children: ComponentChildren }) {
	return (
		<header class="flex items-center gap-2 px-3 py-2 bg-bg-elev border-b border-border">
			{children}
		</header>
	);
}

export function CardBody({ children }: { children: ComponentChildren }) {
	return <div class="p-3">{children}</div>;
}

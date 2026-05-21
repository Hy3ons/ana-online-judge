export function Spinner({ size = 12 }: { size?: number }) {
	return (
		<span
			class="inline-block animate-spin rounded-full border-2 border-fg-muted border-t-transparent"
			style={{ width: `${size}px`, height: `${size}px` }}
			aria-hidden="true"
		/>
	);
}

interface Props {
	onSignIn: () => void;
	onDismiss: () => void;
}

export function SignInBanner({ onSignIn, onDismiss }: Props) {
	return (
		<div class="flex items-center gap-2 px-3 py-2 text-xs bg-bg-elev border-b border-border">
			<span class="flex-1 text-fg-muted">
				Sign in to fetch problem testcases and submit.
			</span>
			<button type="button" class="text-accent hover:underline" onClick={onSignIn}>
				Sign in
			</button>
			<button
				type="button"
				class="text-fg-muted hover:text-fg w-5 h-5 leading-none"
				onClick={onDismiss}
				title="Dismiss"
			>
				×
			</button>
		</div>
	);
}

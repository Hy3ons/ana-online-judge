import { IconButton } from "../../shared/components/IconButton";

interface Props {
	signedIn: boolean;
	username: string | null;
	onSignIn: () => void;
	onSignOut: () => void;
	onRefresh: () => void;
}

export function Header({ signedIn, username, onSignIn, onSignOut, onRefresh }: Props) {
	return (
		<header class="flex items-center justify-between px-3 py-2 border-b border-border">
			<div class="text-xs text-fg-muted">
				{signedIn ? (
					<button
						type="button"
						class="hover:text-fg transition"
						onClick={onSignOut}
						title="Sign out"
					>
						{username} ▼
					</button>
				) : (
					<button type="button" class="text-accent hover:underline" onClick={onSignIn}>
						Sign in
					</button>
				)}
			</div>
			<IconButton onClick={onRefresh} title="Refresh">
				⟳
			</IconButton>
		</header>
	);
}

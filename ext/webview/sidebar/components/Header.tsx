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
			<div class="text-xs text-fg-muted truncate">
				{signedIn ? <span title={username ?? ""}>@{username}</span> : <span>로그아웃됨</span>}
			</div>
			<div class="flex items-center gap-1">
				{signedIn ? (
					<IconButton onClick={onSignOut} title="로그아웃">
						⎋
					</IconButton>
				) : (
					<IconButton onClick={onSignIn} title="로그인">
						⇪
					</IconButton>
				)}
				<IconButton onClick={onRefresh} title="새로고침">
					⟳
				</IconButton>
			</div>
		</header>
	);
}

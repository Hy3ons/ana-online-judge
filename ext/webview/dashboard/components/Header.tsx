import { IconButton } from "../../shared/components/IconButton";

export function Header({
	username,
	onRefresh,
}: {
	username: string | null;
	onRefresh: () => void;
}) {
	return (
		<header class="flex items-center gap-2 pb-2 border-b border-border">
			<span class="flex-1 text-sm font-semibold text-fg">ANA Online Judge</span>
			{username && <span class="text-xs text-fg-muted">@{username}</span>}
			<IconButton title="새로고침" onClick={onRefresh}>
				⟳
			</IconButton>
		</header>
	);
}

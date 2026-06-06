import type { ViewerRow } from "@/actions/submissions/views";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserNameDisplay } from "@/components/user-name-display";
import { formatRelativeKo } from "@/lib/format-time";

export function ViewerList({ viewers }: { viewers: ViewerRow[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">이 코드를 본 사용자 ({viewers.length})</CardTitle>
			</CardHeader>
			<CardContent>
				{viewers.length === 0 ? (
					<p className="text-sm text-muted-foreground">아직 이 코드를 본 사용자가 없습니다.</p>
				) : (
					<ul className="space-y-2">
						{viewers.map((v) => (
							<li key={v.viewerId} className="flex items-center justify-between text-sm">
								<UserNameDisplay
									withLink
									user={{
										name: v.name,
										username: v.username,
										mainExternalSite: v.mainExternalSite,
										mainExternalRating: v.mainExternalRating,
									}}
								/>
								<span className="text-xs text-muted-foreground">
									{formatRelativeKo(v.createdAt)}
								</span>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

import { UserNameDisplay } from "@/components/user-name-display";
import type { ExternalSite } from "@/db/schema";
import { profileUrlFor } from "@/lib/external-sites/styles";

const SITE_LABELS: Record<ExternalSite, string> = {
	codeforces: "Codeforces",
	atcoder: "AtCoder",
};

type ConnectedHandle = {
	provider: ExternalSite;
	handle: string;
	rating: number | null;
};

export function ConnectedHandlesCard({ handles }: { handles: ConnectedHandle[] }) {
	if (handles.length === 0) return null;
	return (
		<div className="space-y-1">
			<ul className="space-y-1">
				{handles.map((h) => (
					<li key={h.provider} className="flex items-center gap-2 text-sm">
						<span className="text-muted-foreground">{SITE_LABELS[h.provider]}:</span>
						<a
							href={profileUrlFor(h.provider, h.handle)}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:underline"
						>
							<UserNameDisplay
								user={{
									name: h.handle,
									username: h.handle,
									mainExternalSite: h.provider,
									mainExternalRating: h.rating,
								}}
							/>
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}

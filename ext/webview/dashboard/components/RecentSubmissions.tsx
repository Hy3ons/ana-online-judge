import type { DashRecentSubmission } from "../../../src/views/dashboard/messages";

export function RecentSubmissions({
	items,
	onOpen,
}: {
	items: DashRecentSubmission[];
	onOpen: (id: number) => void;
}) {
	void onOpen;
	if (items.length === 0) return null;
	return <div>{items.length} submissions</div>; // Task 10 replaces
}

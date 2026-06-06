import type { Metadata } from "next";
import { Suspense } from "react";
import { getAdminUsers } from "@/actions/admin";
import { AdminFilterSelect, AdminListToolbar, AdminSearchInput } from "@/components/admin";
import { SelectionProvider } from "@/components/admin/selection-context";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationLinks } from "@/components/ui/pagination-links";
import type { AdminUsersFilter } from "@/lib/services/users";
import { AnnounceShell } from "./_components/announce-shell";
import { RecipientTable } from "./_components/recipient-table";

export const metadata: Metadata = {
	title: "알림 발송",
};

export default async function AdminNotificationsPage({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		q?: string;
		role?: "user" | "admin";
		accountType?: "oauth" | "local";
	}>;
}) {
	const params = await searchParams;
	const page = Number.parseInt(params.page ?? "1", 10);
	const filter: AdminUsersFilter = {
		search: params.q,
		role: params.role,
		accountType: params.accountType,
	};

	const { users, total } = await getAdminUsers({
		page,
		limit: 20,
		search: params.q,
		role: params.role,
		accountType: params.accountType,
	});
	const totalPages = Math.ceil(total / 20);
	const pageIds = users.map((u) => u.id);

	const buildPageHref = (target: number) => {
		const sp = new URLSearchParams();
		sp.set("page", String(target));
		if (params.q) sp.set("q", params.q);
		if (params.role) sp.set("role", params.role);
		if (params.accountType) sp.set("accountType", params.accountType);
		return `/admin/notifications?${sp.toString()}`;
	};

	return (
		<div className="space-y-6">
			<PageBreadcrumb items={[{ label: "관리자", href: "/admin" }, { label: "알림 발송" }]} />
			<div>
				<h1 className="text-3xl font-bold">알림 발송</h1>
				<p className="text-muted-foreground mt-2">수신자를 선택하고 공지를 발송합니다.</p>
			</div>

			<Suspense>
				<AdminListToolbar>
					<AdminSearchInput paramKey="q" placeholder="아이디·이름·이메일" className="w-[260px]" />
					<AdminFilterSelect
						paramKey="role"
						placeholder="권한"
						options={[
							{ value: "admin", label: "관리자" },
							{ value: "user", label: "일반" },
						]}
					/>
					<AdminFilterSelect
						paramKey="accountType"
						placeholder="계정 유형"
						options={[
							{ value: "local", label: "로컬" },
							{ value: "oauth", label: "OAuth" },
						]}
					/>
				</AdminListToolbar>
			</Suspense>

			<SelectionProvider>
				<AnnounceShell filter={filter} totalCount={total} />
				<Card>
					<CardContent className="p-0">
						{users.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								조건에 맞는 사용자가 없습니다.
							</div>
						) : (
							<RecipientTable users={users} pageIds={pageIds} />
						)}
					</CardContent>
				</Card>
			</SelectionProvider>

			<PaginationLinks currentPage={page} totalPages={totalPages} buildHref={buildPageHref} />
		</div>
	);
}

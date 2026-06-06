"use client";

import Link from "next/link";
import { useSelection } from "@/components/admin/selection-context";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export type RecipientRow = {
	id: number;
	username: string;
	name: string;
	role: "user" | "admin";
};

export function RecipientTable({ users, pageIds }: { users: RecipientRow[]; pageIds: number[] }) {
	const sel = useSelection();
	const allSelectedOnPage =
		sel.mode === "rows" && pageIds.length > 0 && pageIds.every((id) => sel.rowIds.has(id));
	const filterMode = sel.mode === "filter";

	return (
		<Table className="min-w-[640px]">
			<TableHeader>
				<TableRow>
					<TableHead className="w-[40px]">
						<Checkbox
							checked={allSelectedOnPage}
							onCheckedChange={(v) => sel.togglePage(pageIds, v === true)}
							disabled={filterMode}
						/>
					</TableHead>
					<TableHead className="w-[200px]">아이디</TableHead>
					<TableHead>이름</TableHead>
					<TableHead className="w-[100px]">권한</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{users.map((u) => (
					<TableRow key={u.id} data-selected={sel.rowIds.has(u.id) ? "true" : undefined}>
						<TableCell>
							<Checkbox
								checked={sel.rowIds.has(u.id)}
								onCheckedChange={(v) => sel.toggleRow(u.id, v === true)}
								disabled={filterMode}
							/>
						</TableCell>
						<TableCell className="font-medium">
							<Link href={`/profile/${u.username}`} className="text-primary hover:underline">
								<span className="block truncate" title={u.username}>
									{u.username}
								</span>
							</Link>
						</TableCell>
						<TableCell>
							<span className="block truncate" title={u.name}>
								{u.name}
							</span>
						</TableCell>
						<TableCell>
							<Badge variant="outline">{u.role === "admin" ? "관리자" : "일반"}</Badge>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

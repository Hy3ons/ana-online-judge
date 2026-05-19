"use client";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { revokeDeviceAction } from "./actions";

interface TokenRow {
	id: number;
	type: string;
	label: string | null;
	scopes: string[];
	expiresAt: Date;
	lastUsedAt: Date | null;
	createdAt: Date;
	revokedAt: Date | null;
}

function fmt(d: Date | null): string {
	if (!d) return "—";
	return new Intl.DateTimeFormat("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(d));
}

export function DevicesTable({ tokens }: { tokens: TokenRow[] }) {
	if (tokens.length === 0) {
		return <p className="text-sm text-muted-foreground">활성 디바이스가 없습니다.</p>;
	}
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>라벨</TableHead>
					<TableHead>타입</TableHead>
					<TableHead>마지막 사용</TableHead>
					<TableHead>만료</TableHead>
					<TableHead>발급일</TableHead>
					<TableHead className="w-24" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{tokens.map((t) => {
					const active = !t.revokedAt && t.expiresAt > new Date();
					return (
						<TableRow key={t.id} className={active ? "" : "opacity-50"}>
							<TableCell>{t.label ?? "—"}</TableCell>
							<TableCell>{t.type === "oauth_device" ? "VS Code" : "PAT"}</TableCell>
							<TableCell>{fmt(t.lastUsedAt)}</TableCell>
							<TableCell>{fmt(t.expiresAt)}</TableCell>
							<TableCell>{fmt(t.createdAt)}</TableCell>
							<TableCell>
								{active && (
									<form action={revokeDeviceAction}>
										<input type="hidden" name="tokenId" value={t.id} />
										<Button type="submit" variant="destructive" size="sm">
											회수
										</Button>
									</form>
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

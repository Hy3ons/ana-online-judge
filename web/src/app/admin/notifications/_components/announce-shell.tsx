"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	sendAnnouncementByFilterAction,
	sendAnnouncementByIdsAction,
} from "@/actions/notifications";
import { useSelection } from "@/components/admin/selection-context";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { AdminUsersFilter } from "@/lib/services/users";

export function AnnounceShell({
	filter,
	totalCount,
}: {
	filter: AdminUsersFilter;
	totalCount: number;
}) {
	const sel = useSelection();
	const [body, setBody] = useState("");
	const [pending, startTransition] = useTransition();

	const showBanner = sel.mode === "rows" && sel.rowIds.size > 0;
	const filterMode = sel.mode === "filter";
	const bodyEmpty = body.trim().length === 0;

	const onSend = (mode: "selected" | "filter") => {
		startTransition(async () => {
			try {
				const n =
					mode === "selected"
						? await sendAnnouncementByIdsAction([...sel.rowIds], body)
						: await sendAnnouncementByFilterAction(filter, body);
				toast.success(`${n}명에게 발송했습니다.`);
				sel.clear();
				setBody("");
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "발송 실패");
			}
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>공지 작성</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-1">
						<span className="text-sm font-medium">본문 (마크다운)</span>
						<Textarea
							value={body}
							onChange={(e) => setBody(e.target.value)}
							placeholder="공지 본문을 마크다운으로 작성하세요. 링크·강조 등이 사용 가능합니다."
							rows={10}
							className="font-mono text-sm"
						/>
					</div>
					<div className="space-y-1">
						<span className="text-sm font-medium">미리보기</span>
						<div className="min-h-[244px] rounded-[2px] border border-border bg-muted/30 p-3 text-sm">
							{bodyEmpty ? (
								<p className="text-muted-foreground">미리보기가 여기에 표시됩니다.</p>
							) : (
								<MarkdownRenderer content={body} />
							)}
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-sm text-muted-foreground">
						{filterMode
							? `필터에 일치하는 전체 ${totalCount}명이 선택됨.`
							: showBanner
								? `${sel.rowIds.size}명 선택됨.`
								: "수신자를 선택하세요."}
						{showBanner && (
							<>
								{" · "}
								<button
									type="button"
									className="text-primary hover:underline"
									onClick={() => sel.switchToFilterMode()}
								>
									필터에 일치하는 전체 {totalCount}명 선택
								</button>
							</>
						)}
						{filterMode && (
							<>
								{" · "}
								<button
									type="button"
									className="text-muted-foreground hover:underline"
									onClick={() => sel.clear()}
								>
									선택 해제
								</button>
							</>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="default"
							size="sm"
							disabled={!showBanner || bodyEmpty || pending}
							onClick={() => onSend("selected")}
						>
							선택 사용자에게 발송 ({sel.rowIds.size})
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={totalCount === 0 || bodyEmpty || pending}
							onClick={() => onSend("filter")}
						>
							필터 결과 전체에게 발송 ({totalCount})
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

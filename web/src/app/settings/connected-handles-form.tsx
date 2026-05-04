"use client";

import { useState, useTransition } from "react";
import {
	linkHandleAction,
	setMainSiteAction,
	syncMyHandlesAction,
	unlinkHandleAction,
} from "@/actions/external-handles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ExternalSite } from "@/db/schema";
import { useToast } from "@/hooks/use-toast";
import { labelFor } from "@/lib/external-sites/styles";

const ALL_SITES: readonly ExternalSite[] = ["codeforces", "atcoder"] as const;

const SITE_LABEL: Record<ExternalSite, string> = {
	codeforces: "Codeforces",
	atcoder: "AtCoder",
};

type ClientHandle = {
	provider: ExternalSite;
	handle: string;
	rating: number | null;
};

type Props = {
	initialHandles: ClientHandle[];
	initialMainSite: ExternalSite | null;
};

export function ConnectedHandlesForm({ initialHandles, initialMainSite }: Props) {
	const { toast } = useToast();
	const [linkedHandles, setLinkedHandles] = useState<ClientHandle[]>(initialHandles);
	const [mainSite, setMainSite] = useState<ExternalSite | null>(initialMainSite);
	const [handleInput, setHandleInput] = useState<Record<ExternalSite, string>>(() => ({
		codeforces: initialHandles.find((h) => h.provider === "codeforces")?.handle ?? "",
		atcoder: initialHandles.find((h) => h.provider === "atcoder")?.handle ?? "",
	}));
	const [isPending, startTransition] = useTransition();

	const onLink = (provider: ExternalSite) =>
		startTransition(async () => {
			const r = await linkHandleAction(provider, handleInput[provider]);
			if (r.ok) {
				const trimmed = handleInput[provider].trim();
				setLinkedHandles((prev) => {
					const next = prev.filter((h) => h.provider !== provider);
					next.push({ provider, handle: trimmed, rating: r.rating });
					return next;
				});
				setMainSite((prev) => prev ?? provider);
				toast({
					title: "연동 완료",
					description: `${SITE_LABEL[provider]} 핸들을 연동했어요.`,
				});
				return;
			}
			if (r.reason === "empty") {
				toast({
					title: "입력 필요",
					description: "핸들을 입력해주세요.",
					variant: "destructive",
				});
			} else if (r.reason === "not_found") {
				toast({
					title: "연동 실패",
					description: `${SITE_LABEL[provider]}에 해당 핸들이 없어요.`,
					variant: "destructive",
				});
			} else if (r.reason === "duplicate") {
				toast({
					title: "연동 실패",
					description: "이미 다른 사용자가 연동한 핸들이에요.",
					variant: "destructive",
				});
			} else if (r.reason === "external_error") {
				toast({
					title: "연동 실패",
					description: "외부 사이트 응답이 없어요. 잠시 후 다시 시도해주세요.",
					variant: "destructive",
				});
			}
		});

	const onUnlink = (provider: ExternalSite) =>
		startTransition(async () => {
			await unlinkHandleAction(provider);
			setLinkedHandles((prev) => prev.filter((h) => h.provider !== provider));
			setHandleInput((s) => ({ ...s, [provider]: "" }));
			setMainSite((prev) => {
				if (prev !== provider) return prev;
				const remaining = linkedHandles.find((h) => h.provider !== provider);
				return remaining?.provider ?? null;
			});
			toast({
				title: "연동 해제",
				description: `${SITE_LABEL[provider]} 핸들 연동을 해제했어요.`,
			});
		});

	const onMainChange = (v: string) =>
		startTransition(async () => {
			const next = (v || null) as ExternalSite | null;
			await setMainSiteAction(next);
			setMainSite(next);
		});

	const onSyncNow = () =>
		startTransition(async () => {
			const r = await syncMyHandlesAction();
			if (!r.ok) {
				toast({
					title: "잠시만요",
					description: "60초 후 다시 시도해주세요.",
					variant: "destructive",
				});
				return;
			}
			const failed = Object.entries(r.results)
				.filter(([, v]) => v === "failed")
				.map(([k]) => SITE_LABEL[k as ExternalSite]);
			if (failed.length === 0) {
				toast({ title: "동기화 완료", description: "최신 정보로 갱신했어요." });
			} else {
				toast({
					title: "일부 실패",
					description: `${failed.join(", ")} 동기화에 실패했어요.`,
				});
			}
		});

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				{ALL_SITES.map((provider) => {
					const linked = linkedHandles.find((h) => h.provider === provider);
					return (
						<div key={provider} className="flex flex-wrap items-center gap-2 sm:gap-3">
							<Label className="w-24 shrink-0 text-sm font-medium">{SITE_LABEL[provider]}</Label>
							<Input
								value={handleInput[provider]}
								onChange={(e) => setHandleInput((s) => ({ ...s, [provider]: e.target.value }))}
								placeholder="handle"
								disabled={isPending}
								className="max-w-xs"
							/>
							<Button onClick={() => onLink(provider)} disabled={isPending} type="button" size="sm">
								확인 후 저장
							</Button>
							{linked ? (
								<>
									<Button
										onClick={() => onUnlink(provider)}
										disabled={isPending}
										type="button"
										variant="outline"
										size="sm"
									>
										해제
									</Button>
									<span className="text-sm text-muted-foreground">
										{labelFor(provider, linked.rating)}
									</span>
								</>
							) : null}
						</div>
					);
				})}
			</div>

			{linkedHandles.length > 0 ? (
				<div className="space-y-2">
					<Label className="text-sm font-medium">메인으로 표시</Label>
					<RadioGroup
						value={mainSite ?? ""}
						onValueChange={onMainChange}
						className="flex flex-wrap gap-4"
					>
						{linkedHandles.map((h) => (
							<div key={h.provider} className="flex items-center gap-2">
								<RadioGroupItem value={h.provider} id={`main-${h.provider}`} />
								<Label htmlFor={`main-${h.provider}`}>{SITE_LABEL[h.provider]}</Label>
							</div>
						))}
						<div className="flex items-center gap-2">
							<RadioGroupItem value="" id="main-none" />
							<Label htmlFor="main-none">없음</Label>
						</div>
					</RadioGroup>
				</div>
			) : null}

			<Button
				onClick={onSyncNow}
				disabled={isPending || linkedHandles.length === 0}
				type="button"
				variant="secondary"
				size="sm"
			>
				지금 동기화
			</Button>
		</div>
	);
}

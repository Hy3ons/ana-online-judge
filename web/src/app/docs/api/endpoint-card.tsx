"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { publicEnv } from "@/lib/env/publicEnv";
import type { EndpointContract } from "@/lib/services/api-contract";

interface UnifiedParam {
	key: string;
	name: string;
	in: "path" | "query";
	type: string;
	required: boolean;
	placeholder: string;
}

function formatType(type: string, enumValues?: string[]): string {
	if (enumValues && enumValues.length > 0) {
		return enumValues.map((v) => `"${v}"`).join(" | ");
	}
	return type;
}

interface Props {
	ep: EndpointContract;
	anchorId: string;
}

export function EndpointCard({ ep, anchorId }: Props) {
	const params: UnifiedParam[] = useMemo(
		() => [
			...ep.pathParams.map<UnifiedParam>((name) => ({
				key: `path-${name}`,
				name,
				in: "path",
				type: "string",
				required: true,
				placeholder: name,
			})),
			...ep.queryParams.map<UnifiedParam>((p) => ({
				key: `query-${p.name}`,
				name: p.name,
				in: "query",
				type: formatType(p.type, p.enum),
				required: p.required,
				placeholder: p.default !== undefined && p.default !== null ? String(p.default) : p.name,
			})),
		],
		[ep]
	);

	const [values, setValues] = useState<Record<string, string>>({});

	const curl = useMemo(() => {
		let pathPart = ep.path;
		for (const pp of ep.pathParams) {
			const raw = values[`path-${pp}`] ?? "";
			const v = raw.trim();
			pathPart = pathPart.replace(`:${pp}`, v.length > 0 ? v : `<${pp}>`);
		}
		const base = `${publicEnv.NEXT_PUBLIC_APP_URL}/api/v1/public/${pathPart}`;

		const qs: string[] = [];
		for (const q of ep.queryParams) {
			const raw = values[`query-${q.name}`] ?? "";
			const v = raw.trim();
			if (v.length > 0) {
				qs.push(`${q.name}=${v}`);
			} else if (q.required) {
				qs.push(`${q.name}=<${q.name}>`);
			}
		}

		if (qs.length === 0) return `curl -s "${base}"`;
		return `curl -s "${base}?${qs.join("&")}"`;
	}, [ep, values]);

	return (
		<details
			id={anchorId}
			className="group scroll-mt-4 border border-border bg-card transition-colors open:shadow-md"
		>
			<summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
				<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
				<Badge variant="default" className="shrink-0">
					{ep.method}
				</Badge>
				<code className="truncate font-mono text-sm">/api/v1/public/{ep.path}</code>
				<span className="ml-auto hidden truncate text-sm text-muted-foreground md:block">
					{ep.description}
				</span>
			</summary>

			<div className="border-t border-border px-4 py-4 md:px-6">
				<p className="mb-4 text-sm text-muted-foreground md:hidden">{ep.description}</p>

				{params.length > 0 ? (
					<section className="mb-4">
						<h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
							Parameters
						</h3>
						<div className="overflow-x-auto border border-border">
							<table className="w-full text-sm">
								<thead className="bg-primary text-left font-mono uppercase text-primary-foreground">
									<tr>
										<th className="px-3 py-2 text-xs font-medium">name</th>
										<th className="px-3 py-2 text-xs font-medium">in</th>
										<th className="px-3 py-2 text-xs font-medium">type</th>
										<th className="px-3 py-2 text-xs font-medium">required</th>
										<th className="px-3 py-2 text-xs font-medium">value</th>
									</tr>
								</thead>
								<tbody>
									{params.map((p) => (
										<tr key={p.key} className="border-t border-border/60 align-middle">
											<td className="px-3 py-2 font-mono">{p.name}</td>
											<td className="px-3 py-2 font-mono text-xs uppercase text-muted-foreground">
												{p.in}
											</td>
											<td className="px-3 py-2 font-mono text-xs text-muted-foreground">
												{p.type}
											</td>
											<td className="px-3 py-2">
												{p.required ? (
													<span className="font-mono text-xs text-accent">required</span>
												) : (
													<span className="font-mono text-xs text-muted-foreground">optional</span>
												)}
											</td>
											<td className="px-3 py-2">
												<Input
													type="text"
													value={values[p.key] ?? ""}
													onChange={(e) =>
														setValues((prev) => ({ ...prev, [p.key]: e.target.value }))
													}
													placeholder={p.placeholder}
													className="h-8 min-w-[8rem] font-mono text-xs"
													aria-label={`${p.name} 값`}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				) : (
					<p className="mb-4 text-sm text-muted-foreground">파라미터가 없습니다.</p>
				)}

				<section>
					<h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
						Example
					</h3>
					<pre className="overflow-x-auto border border-border bg-muted p-3 text-xs">
						<code className="font-mono">{curl}</code>
					</pre>
				</section>
			</div>
		</details>
	);
}

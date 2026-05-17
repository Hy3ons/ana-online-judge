import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { generateContracts } from "@/lib/services/api-contract";
import { publicEndpoints } from "@/lib/services/public-api-registry";

export const metadata: Metadata = {
	title: "API 문서",
	description: "ANA Online Judge 공용 API 레퍼런스",
};

export const dynamic = "force-dynamic";

type ParamRow = {
	key: string;
	name: string;
	in: "path" | "query";
	type: string;
	required: boolean;
	default?: unknown;
	enum?: string[];
};

function buildAnchorId(method: string, path: string): string {
	return `ep-${method.toLowerCase()}-${path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
}

function buildCurlExample(path: string, pathParams: string[]): string {
	let p = path;
	for (const name of pathParams) {
		p = p.replace(`:${name}`, `<${name}>`);
	}
	return `curl -s "https://<host>/api/v1/public/${p}"`;
}

export default function ApiDocsPage() {
	const contracts = generateContracts(publicEndpoints);

	return (
		<div className="page-container py-8">
			<PageBreadcrumb items={[{ label: "API 문서" }]} />

			<div className="mb-6 space-y-3">
				<h1 className="text-2xl font-bold tracking-tight">공용 API</h1>
			</div>

			<Card className="mb-6">
				<CardContent className="py-4">
					<dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
						<dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
							Base URL
						</dt>
						<dd>
							<code className="rounded-[2px] bg-muted px-1.5 py-0.5 font-mono">/api/v1/public</code>
						</dd>

						<dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
							Authentication
						</dt>
						<dd className="text-muted-foreground">없음 — 모든 endpoint는 anonymous read.</dd>

						<dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
							Rate limit
						</dt>
						<dd className="text-muted-foreground">
							IP 기준 분당 60회. 초과 시{" "}
							<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono text-xs">429</code>와{" "}
							<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono text-xs">
								Retry-After
							</code>{" "}
							헤더 반환.
						</dd>

						<dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
							Response headers
						</dt>
						<dd className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
							<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono text-xs">
								X-RateLimit-Limit
							</code>
							<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono text-xs">
								X-RateLimit-Remaining
							</code>
							<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono text-xs">
								X-RateLimit-Reset
							</code>
							<span className="text-xs">(epoch 초)</span>
						</dd>
					</dl>
				</CardContent>
			</Card>

			<div className="grid gap-8 lg:grid-cols-[220px_1fr]">
				<aside className="hidden lg:block">
					<nav
						aria-label="API endpoint 목록"
						className="sticky top-4 border border-border bg-card p-3"
					>
						<p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
							Endpoints
						</p>
						<ul className="space-y-0.5 text-sm">
							{contracts.map((ep) => {
								const id = buildAnchorId(ep.method, ep.path);
								return (
									<li key={id}>
										<a
											href={`#${id}`}
											className="flex items-center gap-2 rounded-[2px] px-2 py-1 hover:bg-muted"
										>
											<span className="w-9 shrink-0 font-mono text-[10px] font-semibold uppercase text-accent">
												{ep.method}
											</span>
											<span className="truncate font-mono text-xs">{ep.path}</span>
										</a>
									</li>
								);
							})}
						</ul>
					</nav>
				</aside>

				<div className="space-y-3">
					{contracts.map((ep) => {
						const id = buildAnchorId(ep.method, ep.path);
						const curl = buildCurlExample(ep.path, ep.pathParams);
						const params: ParamRow[] = [
							...ep.pathParams.map<ParamRow>((name) => ({
								key: `path-${name}`,
								name,
								in: "path",
								type: "string",
								required: true,
							})),
							...ep.queryParams.map<ParamRow>((p) => ({
								key: `query-${p.name}`,
								name: p.name,
								in: "query",
								type: p.type,
								required: p.required,
								default: p.default,
								enum: p.enum,
							})),
						];

						return (
							<details
								key={id}
								id={id}
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
															<th className="px-3 py-2 text-xs font-medium">default</th>
															<th className="px-3 py-2 text-xs font-medium">enum</th>
														</tr>
													</thead>
													<tbody>
														{params.map((p) => (
															<tr key={p.key} className="border-t border-border/60">
																<td className="px-3 py-2 font-mono">{p.name}</td>
																<td className="px-3 py-2 font-mono text-xs uppercase text-muted-foreground">
																	{p.in}
																</td>
																<td className="px-3 py-2 text-muted-foreground">{p.type}</td>
																<td className="px-3 py-2 text-muted-foreground">
																	{p.required ? (
																		<span className="font-mono text-xs text-accent">required</span>
																	) : (
																		<span className="font-mono text-xs">optional</span>
																	)}
																</td>
																<td className="px-3 py-2 font-mono text-xs text-muted-foreground">
																	{p.default === undefined ? "—" : String(p.default)}
																</td>
																<td className="px-3 py-2 font-mono text-xs text-muted-foreground">
																	{p.enum ? p.enum.join(" | ") : "—"}
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
					})}
				</div>
			</div>
		</div>
	);
}

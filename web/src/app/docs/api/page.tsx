import type { Metadata } from "next";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateContracts } from "@/lib/services/api-contract";
import { publicEndpoints } from "@/lib/services/public-api-registry";

export const metadata: Metadata = {
	title: "API 문서",
	description: "ANA Online Judge 공용 API 레퍼런스",
};

export const dynamic = "force-dynamic";

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

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="text-2xl">공용 API</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm text-muted-foreground">
					<p>
						모든 endpoint는 base URL{" "}
						<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono">/api/v1/public</code>{" "}
						아래에 위치합니다. 인증은 필요하지 않으며, IP 기준으로 분당 60회 요청 제한이 적용됩니다.
					</p>
					<p>
						응답 헤더에{" "}
						<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono">X-RateLimit-Limit</code>,{" "}
						<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono">
							X-RateLimit-Remaining
						</code>
						,{" "}
						<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono">X-RateLimit-Reset</code>{" "}
						(epoch 초)이 포함됩니다. 한도를 초과하면 HTTP 429와 함께{" "}
						<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono">Retry-After</code> 헤더를
						받습니다.
					</p>
				</CardContent>
			</Card>

			<div className="space-y-4">
				{contracts.map((ep) => {
					const curl = buildCurlExample(ep.path, ep.pathParams);
					return (
						<Card key={`${ep.method}-${ep.path}`}>
							<CardHeader className="flex flex-row items-start gap-3 space-y-0">
								<Badge variant="default" className="mt-0.5 shrink-0">
									{ep.method}
								</Badge>
								<div className="space-y-1">
									<CardTitle className="font-mono text-base">/api/v1/public/{ep.path}</CardTitle>
									<p className="text-sm text-muted-foreground">{ep.description}</p>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{ep.pathParams.length > 0 && (
									<section>
										<h3 className="mb-2 text-sm font-semibold">Path parameters</h3>
										<ul className="space-y-1 text-sm">
											{ep.pathParams.map((name) => (
												<li key={name}>
													<code className="rounded-[2px] bg-muted px-1 py-0.5 font-mono">
														{name}
													</code>{" "}
													<span className="text-muted-foreground">(string, required)</span>
												</li>
											))}
										</ul>
									</section>
								)}

								{ep.queryParams.length > 0 && (
									<section>
										<h3 className="mb-2 text-sm font-semibold">Query parameters</h3>
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead className="border-b border-border bg-primary text-left font-mono uppercase text-primary-foreground">
													<tr>
														<th className="px-3 py-1.5 font-medium">name</th>
														<th className="px-3 py-1.5 font-medium">type</th>
														<th className="px-3 py-1.5 font-medium">required</th>
														<th className="px-3 py-1.5 font-medium">default</th>
														<th className="px-3 py-1.5 font-medium">enum</th>
													</tr>
												</thead>
												<tbody>
													{ep.queryParams.map((p) => (
														<tr key={p.name} className="border-b border-border/60 last:border-0">
															<td className="px-3 py-1.5 font-mono">{p.name}</td>
															<td className="px-3 py-1.5 text-muted-foreground">{p.type}</td>
															<td className="px-3 py-1.5 text-muted-foreground">
																{p.required ? "yes" : "no"}
															</td>
															<td className="px-3 py-1.5 font-mono text-muted-foreground">
																{p.default === undefined ? "—" : String(p.default)}
															</td>
															<td className="px-3 py-1.5 font-mono text-muted-foreground">
																{p.enum ? p.enum.join(" | ") : "—"}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</section>
								)}

								<section>
									<h3 className="mb-2 text-sm font-semibold">Example</h3>
									<pre className="overflow-x-auto rounded-[2px] bg-muted p-3 text-xs">
										<code>{curl}</code>
									</pre>
								</section>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}

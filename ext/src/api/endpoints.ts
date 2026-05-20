import type { ApiClient } from "./client";

export interface UserMe {
	id: number;
	username: string;
	name: string | null;
	role: string;
	rating: number | null;
	createdAt: string; // ISO
}

export interface ProblemExample {
	input: string;
	output: string;
}

export interface PublicProblemDetail {
	id: number;
	title: string;
	content: string; // markdown problem statement (server field is `content`, not `description`)
	tier: number;
	problemType: string;
	timeLimit: number; // ms
	memoryLimit: number; // MB
	allowedLanguages: string[] | null;
	hasSubtasks: boolean;
	maxScore: number;
	authors: { username: string; name: string }[];
	createdAt: string;
	examples: ProblemExample[];
}

export interface PublicProblemListItem {
	id: number;
	title: string;
	tier?: number;
	solvedCount?: number;
}

export interface SubmitInput {
	problemId: number;
	code: string;
	language: string;
	contestId?: number;
}

export interface SubmitResponse {
	submissionId: number;
}

export interface SubmissionSummary {
	id: number;
	problemId: number;
	problemTitle: string;
	language: string;
	verdict: string;
	createdAt: string; // ISO from JSON serialization of Date
}

export interface SubmissionDetail extends SubmissionSummary {
	perTestcase?: Array<{ index: number; verdict: string; timeMs?: number; memoryKb?: number }>;
	compileMessage?: string;
}

export interface ContestActiveItem {
	id: number;
	title: string;
	startTime: string; // ISO from JSON serialization
	endTime: string;
	status: "upcoming" | "running";
	problems: Array<{ id: number; title: string; label: string }>;
}

export interface LanguageMeta {
	id: string;
	displayName: string;
	fileExtensions: string[];
	defaultExtension: string;
	compile?: { command: string; args: string[] };
	run: { command: string; args: string[] };
	timeMultiplier: number;
	timeAddSec: number;
	memoryMultiplier: number;
	memoryAddMb: number;
}

export class Endpoints {
	constructor(private readonly client: ApiClient) {}

	me(): Promise<UserMe> {
		return this.client.request("/api/v1/user/me");
	}

	searchProblems(q: string, limit = 30): Promise<{ problems: PublicProblemListItem[] }> {
		return this.client.request("/api/v1/public/problems", {
			auth: false,
			query: { search: q, limit },
		});
	}

	getProblem(id: number): Promise<PublicProblemDetail> {
		return this.client.request(`/api/v1/public/problems/${id}`, { auth: false });
	}

	languages(): Promise<{ languages: LanguageMeta[] }> {
		return this.client.request("/api/v1/public/meta/languages", { auth: false });
	}

	submit(input: SubmitInput): Promise<SubmitResponse> {
		return this.client.request("/api/v1/user/submissions", {
			method: "POST",
			body: input,
		});
	}

	listMySubmissions(
		page = 1,
		limit = 30
	): Promise<{ submissions: SubmissionSummary[]; total: number; page: number; limit: number }> {
		return this.client.request("/api/v1/user/submissions", { query: { page, limit } });
	}

	getMySubmission(id: number): Promise<SubmissionDetail> {
		return this.client.request(`/api/v1/user/submissions/${id}`);
	}

	activeContests(): Promise<{ contests: ContestActiveItem[] }> {
		return this.client.request("/api/v1/user/contests/active");
	}

	/** Returns a streaming response; caller parses SSE via api/sse.ts (Task 10). */
	submissionStream(id: number, signal?: AbortSignal): Promise<Response> {
		return this.client.stream(`/api/v1/user/submissions/${id}/stream`, { signal });
	}
}

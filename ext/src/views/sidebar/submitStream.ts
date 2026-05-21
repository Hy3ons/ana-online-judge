import { iterSse } from "../../api/sse";
import type { SubmissionVerdictTag } from "./messages";

export interface SubmitStreamEvents {
	/** Optional fine-grained progress (0–100) from server `progress` events. */
	progress?(args: { percentage: number }): void;
	/** Stream ended with a `complete` event — caller must fetch final verdict. */
	complete(): void;
	error(message: string): void;
}

const KNOWN_VERDICTS = new Set<SubmissionVerdictTag>([
	"pending",
	"judging",
	"accepted",
	"wrong_answer",
	"time_limit_exceeded",
	"memory_limit_exceeded",
	"runtime_error",
	"compile_error",
	"system_error",
	"skipped",
	"presentation_error",
	"fail",
	"partial",
]);

export function toVerdict(raw: string | undefined): SubmissionVerdictTag | undefined {
	if (!raw) return undefined;
	return KNOWN_VERDICTS.has(raw as SubmissionVerdictTag)
		? (raw as SubmissionVerdictTag)
		: "system_error";
}

/**
 * Consume the submission SSE stream emitted by `buildSubmissionStream`.
 *
 * Server event protocol (mirrors `web/src/app/submissions/[id]/submission-status.tsx`):
 *   - `connected` — {submissionId}; informational, ignored.
 *   - `progress`  — {percentage}; forwarded to ev.progress if provided.
 *   - `complete`  — {submissionId}; signals judging is done. Caller is expected to
 *                   fetch the final verdict via REST (e.g. endpoints.getMySubmission).
 *
 * Heartbeat lines (`: heartbeat`) are SSE comments and dropped by the parser.
 */
export async function submitStream(
	res: Response,
	signal: AbortSignal,
	ev: SubmitStreamEvents
): Promise<void> {
	try {
		for await (const evt of iterSse(res, signal)) {
			if (evt.event === "progress" && evt.data) {
				try {
					const payload = JSON.parse(evt.data) as { percentage?: number };
					if (typeof payload.percentage === "number") {
						ev.progress?.({ percentage: payload.percentage });
					}
				} catch {
					/* ignore malformed progress payload */
				}
				continue;
			}
			if (evt.event === "complete") {
				ev.complete();
				return;
			}
			// `connected` and unknown events are ignored.
		}
	} catch (e) {
		ev.error((e as Error).message);
	}
}

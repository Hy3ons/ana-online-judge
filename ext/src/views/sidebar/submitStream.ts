import { iterSse } from "../../api/sse";
import type { SubmissionVerdictTag } from "./messages";

export interface SubmitStreamEvents {
	progress(args: { verdict?: SubmissionVerdictTag; pass: number; total: number }): void;
	done(args: { verdict: SubmissionVerdictTag; pass: number; total: number }): void;
	error(message: string): void;
}

interface SsePayload {
	verdict?: string;
	pass?: number;
	total?: number;
	finished?: boolean;
}

export async function submitStream(
	res: Response,
	signal: AbortSignal,
	ev: SubmitStreamEvents
): Promise<void> {
	try {
		for await (const evt of iterSse(res, signal)) {
			if (!evt.data) continue;
			let payload: SsePayload;
			try {
				payload = JSON.parse(evt.data);
			} catch {
				continue;
			}
			if (payload.finished) {
				ev.done({
					verdict: payload.verdict ?? "?",
					pass: payload.pass ?? 0,
					total: payload.total ?? 0,
				});
				return;
			}
			ev.progress({
				verdict: payload.verdict,
				pass: payload.pass ?? 0,
				total: payload.total ?? 0,
			});
		}
	} catch (e) {
		ev.error((e as Error).message);
	}
}

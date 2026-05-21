export interface SseEvent {
	event: string; // default "message"
	data: string;
	id?: string;
}

/**
 * Stateful line-buffered SSE parser. Feed chunks; receive complete events.
 * Spec: https://html.spec.whatwg.org/multipage/server-sent-events.html
 */
export class SseParser {
	private buffer = "";
	private cur: { event: string; data: string[]; id?: string } = {
		event: "message",
		data: [],
	};

	feed(chunk: string): SseEvent[] {
		this.buffer += chunk;
		const out: SseEvent[] = [];
		while (true) {
			const nl = this.buffer.indexOf("\n");
			if (nl < 0) break;
			let line = this.buffer.slice(0, nl);
			this.buffer = this.buffer.slice(nl + 1);
			// strip optional trailing CR
			if (line.endsWith("\r")) line = line.slice(0, -1);

			if (line === "") {
				// dispatch
				if (this.cur.data.length > 0 || this.cur.event !== "message") {
					out.push({
						event: this.cur.event,
						data: this.cur.data.join("\n"),
						id: this.cur.id,
					});
				}
				this.cur = { event: "message", data: [] };
				continue;
			}
			if (line.startsWith(":")) continue; // comment
			const colon = line.indexOf(":");
			const field = colon === -1 ? line : line.slice(0, colon);
			let value = colon === -1 ? "" : line.slice(colon + 1);
			if (value.startsWith(" ")) value = value.slice(1);
			switch (field) {
				case "event":
					this.cur.event = value || "message";
					break;
				case "data":
					this.cur.data.push(value);
					break;
				case "id":
					this.cur.id = value;
					break;
				default:
					break;
			}
		}
		return out;
	}
}

/** Iterate SSE events from a fetch Response. */
export async function* iterSse(res: Response, signal?: AbortSignal): AsyncGenerator<SseEvent> {
	if (!res.body) return;
	const reader = res.body.getReader();
	const decoder = new TextDecoder("utf-8");
	const parser = new SseParser();
	try {
		for (;;) {
			if (signal?.aborted) return;
			const { value, done } = await reader.read();
			if (done) return;
			const chunk = decoder.decode(value, { stream: true });
			for (const ev of parser.feed(chunk)) yield ev;
		}
	} finally {
		try {
			await reader.cancel();
		} catch {
			/* ignore */
		}
	}
}

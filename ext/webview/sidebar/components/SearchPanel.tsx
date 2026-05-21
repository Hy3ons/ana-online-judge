import { useEffect, useRef, useState } from "preact/hooks";
import type { SearchProblemHit } from "../../../src/views/sidebar/messages";
import { Spinner } from "../../shared/components/Spinner";

interface Props {
	results: SearchProblemHit[] | null;
	loading: boolean;
	error: string | null;
	query: string;
	onQuery: (q: string) => void;
	onPick: (id: number) => void;
	onClose: () => void;
}

const DEBOUNCE_MS = 250;

export function SearchPanel({ results, loading, error, query, onQuery, onPick, onClose }: Props) {
	const [draft, setDraft] = useState(query);
	const inputRef = useRef<HTMLInputElement>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => onQuery(draft), DEBOUNCE_MS);
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, [draft]);

	return (
		<section class="flex-1 flex flex-col overflow-hidden">
			<div class="flex items-center gap-2 px-3 py-2 border-b border-border bg-bg-elev">
				<input
					ref={inputRef}
					type="text"
					class="flex-1 px-2 py-1 rounded text-sm"
					placeholder="문제 번호 또는 키워드"
					value={draft}
					onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
				/>
				<button
					type="button"
					class="text-fg-muted hover:text-fg text-xs px-2 py-1 rounded border border-border"
					onClick={onClose}
					title="검색 닫기"
				>
					×
				</button>
			</div>
			<div class="flex-1 overflow-y-auto">
				{loading && (
					<div class="flex items-center justify-center py-6 gap-2 text-fg-muted text-xs">
						<Spinner />
						<span>검색 중…</span>
					</div>
				)}
				{!loading && error && (
					<p class="px-3 py-4 text-xs text-bad">검색 실패: {error}</p>
				)}
				{!loading && !error && results !== null && results.length === 0 && draft.trim() !== "" && (
					<p class="px-3 py-6 text-center text-sm text-fg-muted">결과 없음</p>
				)}
				{!loading && !error && results !== null && results.length === 0 && draft.trim() === "" && (
					<p class="px-3 py-6 text-center text-sm text-fg-muted">
						키워드 또는 문제 번호를 입력하세요
					</p>
				)}
				{!loading && results !== null && results.length > 0 && (
					<ul>
						{results.map((p) => (
							<li key={p.id}>
								<button
									type="button"
									class="w-full text-left px-3 py-2 hover:bg-bg-elev border-b border-border text-sm"
									onClick={() => onPick(p.id)}
								>
									<span class="font-mono text-fg-muted text-xs mr-2">#{p.id}</span>
									<span class="text-fg">{p.title}</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}

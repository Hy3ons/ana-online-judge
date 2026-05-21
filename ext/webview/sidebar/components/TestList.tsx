import type { TestcaseView } from "../../../src/views/sidebar/messages";
import { TestcaseCard } from "./TestcaseCard";

interface Props {
	cases: TestcaseView[];
	onRunCase: (index: number) => void;
	onRemoveCase: (index: number) => void;
	onEditCase: (index: number, input: string, expected: string) => void;
}

export function TestList({ cases, onRunCase, onRemoveCase, onEditCase }: Props) {
	return (
		<section class="flex-1 overflow-y-auto pt-2">
			<h3 class="px-3 mb-1 text-xs text-fg-muted uppercase tracking-wide">
				테스트케이스 ({cases.length})
			</h3>
			{cases.length === 0 ? (
				<p class="px-3 py-6 text-sm text-fg-muted text-center">
					테스트케이스가 없습니다. ＋ 버튼으로 추가하세요.
				</p>
			) : (
				cases.map((tc) => (
					<TestcaseCard
						key={tc.index}
						tc={tc}
						onRun={() => onRunCase(tc.index)}
						onRemove={() => onRemoveCase(tc.index)}
						onEdit={(input, expected) => onEditCase(tc.index, input, expected)}
					/>
				))
			)}
		</section>
	);
}

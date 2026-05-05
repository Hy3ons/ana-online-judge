"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { useState, useTransition } from "react";
import { removeProblemAction, reorderItemsAction } from "@/actions/problem-sets";
import { Button } from "@/components/ui/button";
import type { ProblemSetItemRow } from "@/lib/services/problem-sets";

function SortableRow({
	item,
	onRemove,
	disabled,
}: {
	item: ProblemSetItemRow;
	onRemove: () => void;
	disabled: boolean;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.itemId,
	});
	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	};
	return (
		<li ref={setNodeRef} style={style} className="flex items-center gap-2 px-3 py-2 bg-background">
			<button
				type="button"
				className="cursor-grab text-muted-foreground"
				{...attributes}
				{...listeners}
				aria-label="드래그하여 순서 변경"
			>
				<GripVertical className="size-4" />
			</button>
			<span className="flex-1">{item.problem.title}</span>
			<Button
				size="sm"
				variant="ghost"
				disabled={disabled}
				onClick={onRemove}
				className="text-destructive"
				aria-label="문제 제거"
			>
				<X className="size-4" />
			</Button>
		</li>
	);
}

export function ProblemSetEditor({
	problemSetId,
	initialItems,
}: {
	problemSetId: number;
	initialItems: ProblemSetItemRow[];
}) {
	const [items, setItems] = useState(initialItems);
	const [pending, startTransition] = useTransition();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const onDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = items.findIndex((i) => i.itemId === active.id);
		const newIndex = items.findIndex((i) => i.itemId === over.id);
		if (oldIndex < 0 || newIndex < 0) return;
		const next = arrayMove(items, oldIndex, newIndex);
		const prev = items;
		setItems(next);
		const ordered = next.map((it, idx) => ({ id: it.itemId, order: idx }));
		startTransition(async () => {
			try {
				await reorderItemsAction(problemSetId, ordered);
			} catch {
				setItems(prev);
			}
		});
	};

	const onRemove = (problemId: number) => {
		const prev = items;
		setItems((cur) => cur.filter((i) => i.problem.id !== problemId));
		startTransition(async () => {
			try {
				await removeProblemAction(problemSetId, problemId);
			} catch {
				setItems(prev);
			}
		});
	};

	if (items.length === 0) {
		return (
			<div className="rounded-md border p-8 text-center text-muted-foreground">
				문제가 없습니다. 위쪽 "문제 추가" 버튼으로 추가하세요.
			</div>
		);
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
			<SortableContext items={items.map((i) => i.itemId)} strategy={verticalListSortingStrategy}>
				<ol className="rounded-md border divide-y">
					{items.map((it) => (
						<SortableRow
							key={it.itemId}
							item={it}
							onRemove={() => onRemove(it.problem.id)}
							disabled={pending}
						/>
					))}
				</ol>
			</SortableContext>
		</DndContext>
	);
}

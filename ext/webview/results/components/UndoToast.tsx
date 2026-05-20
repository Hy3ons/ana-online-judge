import { Toast } from "../../shared/components/Toast";

export function UndoToast({
	index,
	message,
	onUndo,
	onDismiss,
}: {
	index: number;
	message: string;
	onUndo: () => void;
	onDismiss: () => void;
}) {
	void index; // reserved for future per-toast keying if multiple stack
	return (
		<Toast
			message={message}
			actionLabel="Undo"
			onAction={onUndo}
			onDismiss={onDismiss}
			durationMs={5000}
		/>
	);
}

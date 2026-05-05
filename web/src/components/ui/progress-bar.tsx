import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE_CLS: Record<Size, { bar: string; text: string; gap: string }> = {
	sm: { bar: "h-1.5", text: "text-xs", gap: "gap-1" },
	md: { bar: "h-2", text: "text-sm", gap: "gap-1.5" },
	lg: { bar: "h-3", text: "text-base", gap: "gap-2" },
};

export interface ProgressBarProps {
	current: number;
	total: number;
	showCount?: boolean;
	showPercent?: boolean;
	size?: Size;
	label?: string;
	className?: string;
}

export function ProgressBar({
	current,
	total,
	showCount = true,
	showPercent = false,
	size = "md",
	label,
	className,
}: ProgressBarProps) {
	const safeTotal = Math.max(0, total);
	const safeCurrent = Math.max(0, Math.min(current, safeTotal));
	const percent = safeTotal === 0 ? 0 : Math.round((safeCurrent / safeTotal) * 100);
	const cls = SIZE_CLS[size];

	return (
		<div className={cn("flex flex-col w-full", cls.gap, className)}>
			{(label || showCount || showPercent) && (
				<div className={cn("flex items-center justify-between", cls.text, "text-muted-foreground")}>
					<span>{label}</span>
					<span className="tabular-nums">
						{showCount ? `${safeCurrent} / ${safeTotal}` : null}
						{showCount && showPercent ? " " : null}
						{showPercent ? `(${percent}%)` : null}
					</span>
				</div>
			)}
			<Progress value={percent} className={cls.bar} />
		</div>
	);
}

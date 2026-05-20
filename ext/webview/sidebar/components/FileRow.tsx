interface Props {
	fileName: string;
	languageLabel: string;
}

export function FileRow({ fileName, languageLabel }: Props) {
	return (
		<div class="flex items-center gap-2 px-3 py-2 text-sm">
			<span class="font-mono text-fg truncate flex-1" title={fileName}>
				{fileName}
			</span>
			<span class="text-xs text-fg-muted px-2 py-0.5 rounded bg-bg-elev border border-border">
				{languageLabel}
			</span>
		</div>
	);
}

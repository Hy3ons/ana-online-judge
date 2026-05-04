import Link from "next/link";
import type { CSSProperties } from "react";
import type { ExternalSite } from "@/db/schema";
import { styleFor } from "@/lib/external-sites/styles";
import { cn } from "@/lib/utils";

export type UserNameDisplayUser = {
	name: string;
	username: string;
	mainExternalSite: ExternalSite | null;
	mainExternalRating: number | null;
};

export type UserNameDisplayProps = {
	user: UserNameDisplayUser;
	withLink?: boolean;
	className?: string;
};

export function UserNameDisplay({ user, withLink = false, className }: UserNameDisplayProps) {
	const style = user.mainExternalSite
		? styleFor(user.mainExternalSite, user.mainExternalRating)
		: null;
	const content = renderName(user.name, style, className);
	if (!withLink) return content;
	return (
		<Link href={`/profile/${user.username}`} className="hover:underline">
			{content}
		</Link>
	);
}

function renderName(name: string, style: ReturnType<typeof styleFor>, className?: string) {
	if (!style) {
		return <span className={className}>{name}</span>;
	}
	const css: CSSProperties = {};
	if (style.gradient) {
		css.background = style.gradient;
		css.WebkitBackgroundClip = "text";
		css.backgroundClip = "text";
		css.color = "transparent";
	} else if (style.color) {
		css.color = style.color;
	}
	if (style.bold) css.fontWeight = 700;

	if (style.firstCharBlack && name.length > 0) {
		return (
			<span className={cn("inline", className)}>
				<span style={{ color: "#000", fontWeight: css.fontWeight }}>{name[0]}</span>
				<span style={css}>{name.slice(1)}</span>
			</span>
		);
	}
	return (
		<span className={className} style={css}>
			{name}
		</span>
	);
}

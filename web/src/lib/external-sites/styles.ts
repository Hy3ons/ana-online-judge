import type { ExternalSite, UserNameStyle } from "./types";

export function styleFor(site: ExternalSite, rating: number | null): UserNameStyle | null {
	if (site === "codeforces") return cfStyle(rating);
	if (site === "atcoder") return atcStyle(rating);
	return null;
}

export function labelFor(site: ExternalSite, rating: number | null): string {
	if (rating === null) return "Unrated";
	if (site === "codeforces") return `${cfRankName(rating)} ${rating}`;
	if (site === "atcoder") return `${atcRankName(rating)} ${rating}`;
	return String(rating);
}

export function profileUrlFor(site: ExternalSite, handle: string): string {
	if (site === "codeforces") return `https://codeforces.com/profile/${encodeURIComponent(handle)}`;
	if (site === "atcoder") return `https://atcoder.jp/users/${encodeURIComponent(handle)}`;
	// Fallback for future sites that haven't been wired yet
	return "#";
}

// Codeforces user colors verified from community.css (.rated-user, .user-*).
// Unrated users (rating null — registered but never participated in rated contest)
// fall into the same gray as Newbie on the real site, so we collapse them.
// LGM (3000+) = solid red + first-letter black on the real site (no gradient).
// Bold across all tiers is applied at the render layer (any linked handle = bold).
function cfStyle(rating: number | null): UserNameStyle {
	if (rating === null || rating < 1200) return { color: "#808080" };
	if (rating < 1400) return { color: "#008000" };
	if (rating < 1600) return { color: "#03A89E" };
	if (rating < 1900) return { color: "#0000FF" };
	if (rating < 2100) return { color: "#AA00AA" };
	if (rating < 2400) return { color: "#FF8C00" };
	if (rating < 2600) return { color: "#FF0000" };
	return { color: "#FF0000", firstCharBlack: true };
}

function cfRankName(rating: number): string {
	if (rating < 1200) return "Newbie";
	if (rating < 1400) return "Pupil";
	if (rating < 1600) return "Specialist";
	if (rating < 1900) return "Expert";
	if (rating < 2100) return "Candidate Master";
	if (rating < 2300) return "Master";
	if (rating < 2400) return "International Master";
	if (rating < 2600) return "Grandmaster";
	if (rating < 3000) return "International Grandmaster";
	return "Legendary Grandmaster";
}

// AtCoder user colors verified from base.css (.user-red {color:#FF0000;} — plain solid).
// Unrated users (rating null — registered but never participated in rated contest)
// collapse into the same gray as the 0-399 tier (visually identical on the real site).
// Bold across all tiers is applied at the render layer (any linked handle = bold).
function atcStyle(rating: number | null): UserNameStyle {
	if (rating === null || rating < 400) return { color: "#808080" };
	if (rating < 800) return { color: "#804000" };
	if (rating < 1200) return { color: "#008000" };
	if (rating < 1600) return { color: "#00C0C0" };
	if (rating < 2000) return { color: "#0000FF" };
	if (rating < 2400) return { color: "#C0C000" };
	if (rating < 2800) return { color: "#FF8000" };
	return { color: "#FF0000" };
}

function atcRankName(rating: number): string {
	if (rating < 400) return "Gray";
	if (rating < 800) return "Brown";
	if (rating < 1200) return "Green";
	if (rating < 1600) return "Cyan";
	if (rating < 2000) return "Blue";
	if (rating < 2400) return "Yellow";
	if (rating < 2800) return "Orange";
	return "Red";
}

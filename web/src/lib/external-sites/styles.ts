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

// Codeforces user colors verified from community.css (.rated-user, .user-*).
// LGM (3000+) = solid red + first-letter black + bold (no gradient on real site).
function cfStyle(rating: number | null): UserNameStyle | null {
	if (rating === null) return null;
	if (rating < 1200) return { color: "#808080" };
	if (rating < 1400) return { color: "#008000" };
	if (rating < 1600) return { color: "#03A89E" };
	if (rating < 1900) return { color: "#0000FF" };
	if (rating < 2100) return { color: "#AA00AA" };
	if (rating < 2400) return { color: "#FF8C00" };
	if (rating < 2600) return { color: "#FF0000" };
	if (rating < 3000) return { color: "#FF0000", firstCharBlack: true };
	return { color: "#FF0000", firstCharBlack: true, bold: true };
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
// Red (2800+) is solid #FF0000 on the real site. Bold added for visual emphasis only.
function atcStyle(rating: number | null): UserNameStyle | null {
	if (rating === null) return null;
	if (rating < 400) return { color: "#808080" };
	if (rating < 800) return { color: "#804000" };
	if (rating < 1200) return { color: "#008000" };
	if (rating < 1600) return { color: "#00C0C0" };
	if (rating < 2000) return { color: "#0000FF" };
	if (rating < 2400) return { color: "#C0C000" };
	if (rating < 2800) return { color: "#FF8000" };
	return { color: "#FF0000", bold: true };
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

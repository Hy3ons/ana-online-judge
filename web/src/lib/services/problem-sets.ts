export const PROBLEM_SET_MAX_PER_USER = 20;
export const PROBLEM_SET_TITLE_MAX = 80;
export const PROBLEM_SET_DESCRIPTION_MAX = 1000;
export const PROBLEM_SET_LIST_PAGE_SIZE = 20;

export type ListSort = "likes" | "recent" | "problemCount" | "solvedRatio";
export type ListFilter = "all" | "liked" | "mine";

export interface ProblemSetCreator {
	id: number;
	name: string;
}

export interface ProblemSetListRow {
	id: number;
	title: string;
	description: string | null;
	creator: ProblemSetCreator;
	likeCount: number;
	totalCount: number;
	solvedCount: number | null;
	likedByViewer: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ListOptions {
	page: number;
	pageSize?: number;
	sort: ListSort;
	q?: string;
	filter: ListFilter;
	viewerId?: number;
}

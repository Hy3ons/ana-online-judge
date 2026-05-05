// Client-safe constants for problem sets, mirrored by `@/lib/services/problem-sets`.
// Kept in a separate module so client components can import without pulling
// in server-only code (db, drizzle).
export const PROBLEM_SET_MAX_PER_USER = 20;
export const PROBLEM_SET_TITLE_MAX = 80;
export const PROBLEM_SET_DESCRIPTION_MAX = 1000;
export const PROBLEM_SET_LIST_PAGE_SIZE = 20;

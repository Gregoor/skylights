export const SEARCH_TYPES = ["movies", "shows", "books"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

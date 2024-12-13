"use server";

import { desc, eq, inArray, sql } from "drizzle-orm";
import { fromEntries, groupBy, mapValues } from "remeda";

import { db } from "@/db";
import { relsT, tmdbMoviesT, tmdbShowsT } from "@/db/schema";
import { RefItem } from "@/lexicon/types/my/skylights/rel";
import { Book, BOOK_KEY } from "@/rels/BookCard";
import { Movie, MOVIE_KEY, Show, TV_SHOW_KEY } from "@/rels/tmdb";
import { fetchBooks, importRepo, RelRecordValue } from "@/rels/utils";

export type RelsOrderBy = "best" | "recent";

export type Info = {
  books: Record<string, Book>;
  movies: Record<number, Movie>;
  shows: Record<number, Show>;
};

export async function findRelsWithInfo(
  did: string,
  {
    orderBy,
    limit,
    offset,
  }: { orderBy: RelsOrderBy; limit: number; offset: number },
): Promise<{
  rels: Array<{ key: string; value: RelRecordValue }>;
  info: Info;
}> {
  await importRepo(did);

  const rows = await db.query.relsT.findMany({
    where: eq(relsT.did, did),
    orderBy:
      orderBy == "best"
        ? desc(sql`value->'rating'->'value'`)
        : desc(relsT.reviewedAt),
    limit,
    offset,
  });
  const rels = rows.map((row) => ({
    ...row,
    key: row.key!,
    value: row.value as RelRecordValue,
  }));

  const idsByRefs = mapValues(
    groupBy(
      rels.map((r) => r.value.item).filter((i): i is RefItem => "ref" in i),
      (i) => i.ref,
    ),
    (items) => items.map((i) => i.value),
  );
  const movieIds = idsByRefs[MOVIE_KEY];
  const showIds = idsByRefs[TV_SHOW_KEY];
  const [books, movies, shows] = await Promise.all([
    fetchBooks(idsByRefs[BOOK_KEY]),
    movieIds
      ? db.query.tmdbMoviesT.findMany({
          where: inArray(tmdbMoviesT.id, movieIds.map(Number)),
        })
      : [],
    showIds
      ? db.query.tmdbShowsT.findMany({
          where: inArray(tmdbShowsT.id, showIds.map(Number)),
        })
      : [],
  ]);
  return {
    rels,
    info: {
      books: fromEntries(books.map((book) => [book.edition_key, book])),
      movies: fromEntries(movies.map((row) => [row.id, row.value as Movie])),
      shows: fromEntries(shows.map((row) => [row.id, row.value as Show])),
    },
  };
}

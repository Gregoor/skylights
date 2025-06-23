import { db } from "@sl/shared/db";
import { olBooksT, tmdbMoviesT, tmdbShowsT } from "@sl/shared/db/schema";
import { inArray } from "@sl/shared/drizzle-orm";
import { fromEntries, groupBy, mapValues } from "remeda";

import { Item } from "@/lexicon/types/my/skylights/defs";
import { Record as _RelRecord } from "@/lexicon/types/my/skylights/rel";
import { getPublicAgent } from "@/utils";

import { Book, BOOK_KEY } from "./BookCard";
import { Info } from "./info";
import { Movie, MOVIE_KEY, Show, SHOW_KEY } from "./tmdb";

export type RelRecordValue = _RelRecord;
export type RelRecord = {
  uri: string;
  cid: string;
  value: RelRecordValue;
};

export async function fetchBooks(editionKeys: string[]) {
  const response = await fetch(
    "https://openlibrary.org/search.json" +
      `?q=${editionKeys.join(" OR ")}&fields=key,title,author_name,editions,isbn`,
  );
  return (await response.json()).docs as Book[];
}

async function fetchDetailsTMDB(category: "movie" | "tv", id: string) {
  return fetch(`https://api.themoviedb.org/3/${category}/${id}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  }).then((r) => r.json());
}

export async function fetchItemsInfo(items: Item[]): Promise<Info> {
  const idsByRefs: Partial<
    Record<"open-library" | "tmdb:m" | "tmdb:s", string[]>
  > = mapValues(
    groupBy(
      items.filter((i): i is Item => "ref" in i),
      (i) => i.ref,
    ),
    (items) => items.map((i) => i.value),
  );
  const bookIds = idsByRefs[BOOK_KEY];
  const movieIds = idsByRefs[MOVIE_KEY];
  const showIds = idsByRefs[SHOW_KEY];
  const [books, movies, shows] = await Promise.all([
    bookIds
      ? db.query.olBooksT.findMany({ where: inArray(olBooksT.id, bookIds) })
      : ([] as { id: string; value: unknown }[]),
    movieIds
      ? db.query.tmdbMoviesT.findMany({
          where: inArray(tmdbMoviesT.id, movieIds.map(Number)),
        })
      : ([] as { id: number; value: unknown }[]),
    showIds
      ? db.query.tmdbShowsT.findMany({
          where: inArray(tmdbShowsT.id, showIds.map(Number)),
        })
      : ([] as { id: number; value: unknown }[]),
  ]);

  const missingBookIds = bookIds?.filter(
    (id) => !books.some((b) => b.id == id),
  );
  if (missingBookIds && missingBookIds.length > 0) {
    const bookData = await fetchBooks(missingBookIds);
    const missingBooks = await db
      .insert(olBooksT)
      .values(
        bookData
          .map((r) => ({
            id: r.editions.docs.at(0)?.key.split("/").at(2),
            value: r,
          }))
          .filter((r): r is { id: string; value: Book } => !!r.id),
      )
      .onConflictDoNothing()
      .returning();
    books.push(...missingBooks);
  }

  const missingMovieIds = movieIds?.filter(
    (id) => !movies.some((m) => m.id == Number(id)),
  );
  if (missingMovieIds && missingMovieIds.length > 0) {
    const movieData = await Promise.all(
      missingMovieIds.map((id) => fetchDetailsTMDB("movie", id)),
    );
    const missingMovies = await db
      .insert(tmdbMoviesT)
      .values(movieData.map((r) => ({ id: r.id, value: r })))
      .onConflictDoNothing()
      .returning();
    movies.push(...missingMovies);
  }

  const missingShowIds = showIds?.filter(
    (id) => !shows.some((m) => m.id == Number(id)),
  );
  if (missingShowIds && missingShowIds.length > 0) {
    const showData = await Promise.all(
      missingShowIds.map((id) => fetchDetailsTMDB("tv", id)),
    );
    const missingShows = await db
      .insert(tmdbShowsT)
      .values(showData.map((r) => ({ id: r.id, value: r })))
      .onConflictDoNothing()
      .returning();
    shows.push(...missingShows);
  }

  return {
    books: fromEntries(
      books.map((b) => {
        const book = b.value as Book;
        return [book.editions.docs.at(0)?.key.split("/").at(2) ?? "", book];
      }),
    ),
    movies: fromEntries(movies.map((row) => [row.id, row.value as Movie])),
    shows: fromEntries(shows.map((row) => [row.id, row.value as Show])),
  };
}

export async function resolveHandle(handle: string) {
  if (!handle.startsWith("did:plc")) {
    const { data } = await getPublicAgent().resolveHandle({ handle });
    return data.did;
  }
  return handle;
}

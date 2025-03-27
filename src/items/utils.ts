import { iterateAtpRepo, readCar } from "@atcute/car";
import { Agent } from "@atproto/api";
import { DidResolver } from "@atproto/identity";
import { and, eq, inArray, lt } from "drizzle-orm";
import { cache } from "react";
import { fromEntries, groupBy, mapValues } from "remeda";

import { buildMutex, db } from "@/db";
import {
  importedDidsT,
  listItemsT,
  listsT,
  relsT,
  tmdbMoviesT,
  tmdbShowsT,
} from "@/db/schema";
import { Item } from "@/lexicon/types/my/skylights/defs";
import { Record as _RelRecord } from "@/lexicon/types/my/skylights/rel";
import { getPublicAgent } from "@/utils";

import { Book, BOOK_KEY } from "./BookCard";
import { Movie, MOVIE_KEY, Show, SHOW_KEY } from "./tmdb";

export type RelRecordValue = _RelRecord;
export type RelRecord = {
  uri: string;
  cid: string;
  value: RelRecordValue;
};

export const getDidAgent = cache(async (did: string) => {
  const out = await new DidResolver({}).resolve(did);
  const endpoint = out?.service?.find(
    (s) => s.id == "#atproto_pds",
  )?.serviceEndpoint;
  return new Agent(`${endpoint ?? "https://bsky.social"}/xrpc`);
});

export const importRepo = cache(async (did: string) => {
  await buildMutex(`import-repo-${did}`).withLock(async () => {
    await db.transaction(async (db) => {
      const recent = new Date();
      recent.setMinutes(recent.getMinutes() - 30);

      const jetskiTime = await db.query.jetskiTimeT.findFirst();
      const isJetksiBehind = !jetskiTime || jetskiTime.time < recent;

      const recentlyImported = await db.query.importedDidsT.findFirst({
        where: (t) =>
          and(
            eq(t.did, did),
            isJetksiBehind ? lt(t.importedAt, recent) : undefined,
          ),
      });

      if (recentlyImported) {
        return;
      }

      const agent = await getDidAgent(did);
      const { data } = await agent.com.atproto.sync.getRepo({ did });

      await db.delete(relsT).where(eq(relsT.did, did));
      await db.delete(listsT).where(eq(listsT.did, did));
      await db.delete(listItemsT).where(eq(listItemsT.did, did));

      for (const { collection, rkey: key, record: value } of iterateAtpRepo(
        data,
      )) {
        switch (collection) {
          case "my.skylights.rel":
            await db
              .insert(relsT)
              .values({ did, key, value })
              .onConflictDoUpdate({
                target: [relsT.did, relsT.key],
                set: { value },
              });
            break;

          case "my.skylights.list":
            await db
              .insert(listsT)
              .values({ did, key, value })
              .onConflictDoUpdate({
                target: [listsT.did, listsT.key],
                set: { value },
              });
            break;

          case "my.skylights.listItem":
            await db
              .insert(listItemsT)
              .values({ did, key, value })
              .onConflictDoUpdate({
                target: [listItemsT.did, listItemsT.key],
                set: { value },
              });
            break;
        }
      }

      await db.delete(importedDidsT).where(eq(importedDidsT.did, did));
      await db.insert(importedDidsT).values({ did, importedAt: new Date() });
    });
  });
});

export async function fetchBooks(editionKeys: string[]) {
  const response = await fetch(
    "https://openlibrary.org/search.json" +
      `?q=${editionKeys.join(" OR ")}&fields=key,title,author_name,editions,isbn`,
  );
  return (await response.json()).docs as Book[];
}

export type Info = {
  books: Record<string, Book>;
  movies: Record<number, Movie>;
  shows: Record<number, Show>;
};

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
  const idsByRefs = mapValues(
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
    bookIds ? fetchBooks(bookIds) : ([] as Book[]),
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

  const missingMovieIds = movieIds?.filter(
    (id) => !movies.some((m) => m.id == Number(id)),
  );
  if (missingMovieIds?.length > 0) {
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
  if (missingShowIds?.length > 0) {
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
      books.map((book) => [
        book.editions.docs.at(0)?.key.split("/").at(2) ?? "",
        book,
      ]),
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

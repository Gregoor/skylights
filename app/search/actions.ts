"use server";

import { and, eq, inArray, sql } from "drizzle-orm";

import { assertSessionAgent } from "@/auth";
import { db } from "@/db";
import { relsT, tmdbMoviesT, tmdbShowsT } from "@/db/schema";
import { Movie, Show } from "@/rels/tmdb";
import { importRepo } from "@/rels/utils";

export async function findRels(ref: string, values: string[]) {
  const session = await assertSessionAgent();
  const did = session.assertDid;
  await importRepo(did);
  return db.query.relsT.findMany({
    where: and(
      eq(relsT.did, did),
      eq(sql`value->'item'->>'ref'`, ref),
      inArray(sql`value->'item'->>'value'`, values),
    ),
  });
}

export async function searchTMDB(
  category: "movie" | "tv",
  query: string,
): Promise<
  Array<{ type: "movie"; movie: Movie } | { type: "show"; show: Show }>
> {
  const { results }: { results: Array<unknown> } = await fetch(
    `https://api.themoviedb.org/3/search/${category}?query=${query}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    },
  ).then((r) => r.json());

  const table = { movie: tmdbMoviesT, tv: tmdbShowsT }[category];
  await db
    .insert(table)
    .values(results.map((r) => ({ id: (r as Movie | Show).id, value: r })))
    .onConflictDoNothing();

  return results.map((r) =>
    category == "movie"
      ? { type: "movie", movie: r as Movie }
      : { type: "show", show: r as Show },
  );
}

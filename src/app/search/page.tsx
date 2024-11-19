import { db, titleIdxDb } from "@/db";
import { olEditions } from "@/db/ol-schema";

import { sql, inArray } from "drizzle-orm";

import { SearchInput } from "./client";

async function Results({ query }: { query: string }) {
  if (!query) return null;

  const rows = await titleIdxDb.run(
    sql`
      SELECT title
      FROM fts_ol_editions
      WHERE fts_ol_editions MATCH ${query}
      ORDER BY rank
      LIMIT 20
    `,
  );

  const editions = await db
    .select()
    .from(olEditions)
    .where(
      inArray(olEditions.title, rows.rows.map((row) => row.title) as string[]),
    )
    .limit(20);

  return (
    <ul className="flex flex-col gap-2">
      {editions.map((e) => (
        <li key={e.key} className="flex flex-row gap-1 bg-gray-200">
          <img
            src={`https://covers.openlibrary.org/b/olid/${e.key?.split("/").at(2)}-M.jpg`}
          />
          {e.title}
        </li>
      ))}
    </ul>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query: string }>;
}) {
  const { query } = await searchParams;
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <SearchInput defaultValue={query} />
      <Results query={query} />
    </div>
  );
}

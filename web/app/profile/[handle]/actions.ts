"use server";

import { desc, eq, sql } from "drizzle-orm";
import { groupBy, mapValues, prop } from "remeda";

import { db } from "@/db";
import { relsT } from "@/db/schema";
import { fetchBooks, importRepo, RelRecordValue } from "@/rels/utils";

export async function findRelsWithBooks(
  did: string,
  { limit, offset }: { limit: number; offset: number },
) {
  await importRepo(did);

  const rows = await db.query.relsT.findMany({
    where: eq(relsT.did, did),
    orderBy: desc(sql`value->'rating'->'value'`),
    limit,
    offset,
  });
  const rels = rows.map((row) => ({
    ...row,
    key: row.key!,
    value: row.value as RelRecordValue,
  }));

  const books = await fetchBooks(
    rels
      .map((r) => (r.value as RelRecordValue).item)
      .filter((i) => i.ref == "open-library")
      .map((i) => i.value),
  );
  const booksByEditionKey = mapValues(
    groupBy(books, prop("edition_key")),
    (books) => books[0],
  );
  return { rels, booksByEditionKey };
}

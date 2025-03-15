"use server";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { relsT } from "@/db/schema";
import {
  fetchItemsInfo,
  importRepo,
  Info,
  RelRecordValue,
} from "@/items/utils";

export type RelsOrderBy = "best" | "recent";

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
        ? desc(sql`COALESCE((value->'rating'->'value')::INTEGER, -1)`)
        : desc(relsT.reviewedAt),
    limit,
    offset,
  });
  const rels = rows.map((row) => ({
    ...row,
    key: row.key!,
    value: row.value as RelRecordValue,
  }));

  return {
    rels,
    info: await fetchItemsInfo(rels.map((r) => r.value.item)),
  };
}

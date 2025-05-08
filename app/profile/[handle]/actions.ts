"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { listItemsT, relsT } from "@/db/schema";
import { Info } from "@/items/info";
import { fetchItemsInfo, importRepo, RelRecordValue } from "@/items/utils";
import { Item } from "@/lexicon/types/my/skylights/defs";
import { Main as ListItem } from "@/lexicon/types/my/skylights/listItem";

export type RelsOrderBy = "best" | "recent";

export async function findItemsWithInfo(
  did: string,
  {
    orderBy,
    list,
    limit,
    offset,
  }: { orderBy: RelsOrderBy; list?: string; limit: number; offset: number },
): Promise<{
  items: Array<Item>;
  rels: Array<{ key: string; value: RelRecordValue }>;
  info: Info;
}> {
  await importRepo(did);

  if (!list) {
    const rows = await db.query.relsT.findMany({
      where: eq(relsT.did, did),
      orderBy:
        orderBy == "best"
          ? [
              desc(sql`COALESCE((value->'rating'->'value')::INTEGER, -1)`),
              desc(relsT.reviewedAt),
            ]
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
      items: rels.map((r) => r.value.item),
      rels,
      info: await fetchItemsInfo(rels.map((r) => r.value.item)),
    };
  }

  const listItems = await db.query.listItemsT.findMany({
    where: and(
      eq(listItemsT.did, did),
      eq(sql`value->'list'->'type'->>'type'`, `my.skylights.listItem#${list}`),
    ),
    orderBy: desc(sql`value->>'addedAt'`),
    limit,
    offset,
  });

  const items = listItems
    .map((item) => (item.value as ListItem).item)
    .filter((i) => !!i);
  const [info, rels] = await Promise.all([
    fetchItemsInfo(items),
    db.query.relsT.findMany({
      where: and(
        eq(relsT.did, did),
        inArray(
          sql`(value->'item'->>'value')`,
          items.map((item) => item.value),
        ),
      ),
      limit,
      offset,
    }),
  ]);
  return {
    items,
    info,
    rels: rels.map((row) => ({
      ...row,
      key: row.key!,
      value: row.value as RelRecordValue,
    })),
  };
}

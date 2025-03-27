"use server";

import {
  ComAtprotoRepoDeleteRecord,
  ComAtprotoRepoPutRecord,
} from "@atproto/api";
import { TID } from "@atproto/common-web";
import { and, eq, sql } from "drizzle-orm";

import { assertSessionAgent } from "@/auth";
import { db } from "@/db";
import { listItemsT, listsT, relsT } from "@/db/schema";
import { Item } from "@/lexicon/types/my/skylights/defs";
import { validateMain as validateListItem } from "@/lexicon/types/my/skylights/listItem";

const COLLECTION_TABLES = {
  "my.skylights.rel": relsT,
  "my.skylights.list": listsT,
  "my.skylights.listItem": listItemsT,
} as const;

export async function putRecord(
  data: Pick<ComAtprotoRepoPutRecord.InputSchema, "rkey" | "record"> & {
    collection: keyof typeof COLLECTION_TABLES;
  },
) {
  const table = COLLECTION_TABLES[data.collection];
  if (!table) {
    throw new Error(`Unknown collection: ${data.collection}`);
  }
  const agent = await assertSessionAgent();
  const did = agent.assertDid;
  const inputData = { repo: did, ...data };
  const result = await agent.com.atproto.repo.putRecord(inputData);
  if (!result.success) {
    throw new Error(
      `Failed to put record: ${JSON.stringify(inputData, null, 2)}`,
      { cause: result.data },
    );
  }
  await db
    .insert(table)
    .values({ did: did.trim(), key: data.rkey, value: data.record })
    .onConflictDoUpdate({
      target: [table.did, table.key],
      set: { value: data.record },
    });
}

export async function deleteRecord(data: {
  rkey: ComAtprotoRepoDeleteRecord.InputSchema["rkey"];
  collection: keyof typeof COLLECTION_TABLES;
}) {
  const table = COLLECTION_TABLES[data.collection];
  if (!table) {
    throw new Error(`Unknown collection: ${data.collection}`);
  }
  const agent = await assertSessionAgent();
  const did = agent.assertDid;
  const inputData = { repo: did, ...data };
  const result = await agent.com.atproto.repo.deleteRecord(inputData);
  if (!result.success) {
    throw new Error(
      `Failed to delete record: ${JSON.stringify(inputData, null, 2)}`,
      { cause: result.data },
    );
  }
  await db
    .delete(table)
    .where(and(eq(table.did, did), eq(table.key, data.rkey)));
}

export async function fetchListInclusions({ ref, value }: Item) {
  const agent = await assertSessionAgent();
  const did = agent.assertDid;
  const rows = await db
    .select()
    .from(listItemsT)
    .where(
      and(
        eq(listItemsT.did, did),
        eq(sql.raw(`value->'item'->>'ref'`), ref),
        eq(sql.raw(`value->'item'->>'value'`), value),
      ),
    );

  return rows.map((row) => {
    const result = validateListItem(row.value);
    if (!result.success) {
      console.error("Invalid list item", row.value, result.error);
      throw new Error(
        `Invalid list item: ${JSON.stringify(result.error, null, 2)}`,
      );
    }
    return (
      result.value.list as unknown as { type: { type: string } }
    ).type.type.split("#")[1];
  });
}

export async function toggleListInclusion(item: Item, key: string) {
  const agent = await assertSessionAgent();
  const did = agent.assertDid;

  const listItemKey = "my.skylights.listItem#" + key;

  const [listItem] = await db
    .select()
    .from(listItemsT)
    .where(
      and(
        eq(listItemsT.did, did),
        eq(sql`value->'item'->>'ref'`, item.ref),
        eq(sql`value->'item'->>'value'`, item.value),
        eq(sql`value->'list'->'type'->>'type'`, listItemKey),
      ),
    )
    .limit(1);

  if (listItem) {
    await agent.com.atproto.repo.deleteRecord({
      repo: did,
      collection: "my.skylights.listItem",
      rkey: listItem.key,
    });
    await db
      .delete(listItemsT)
      .where(and(eq(listItemsT.did, did), eq(listItemsT.key, listItem.key)));
  } else {
    const recordResult = validateListItem({
      $type: "my.skylights.listItem",
      item,
      list: {
        $type: "my.skylights.listItem#builtin",
        type: {
          $type: "my.skylights.listItem#builtin",
          type: listItemKey,
        },
      },
      addedAt: new Date().toISOString(),
      position: "",
    });

    if (!recordResult.success) {
      console.error("Invalid list item", recordResult.error);
      throw new Error(
        `Invalid list item: ${JSON.stringify(recordResult.error, null, 2)}`,
      );
    }
    const record = recordResult.value;

    const rkey = TID.nextStr();
    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: "my.skylights.listItem",
      rkey: rkey,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      record: record as any,
    });
    await db.insert(listItemsT).values({ did, key: rkey, value: record });
  }
}

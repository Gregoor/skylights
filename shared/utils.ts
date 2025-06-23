import { iterateAtpRepo } from "@atcute/car";
import { Agent } from "@atproto/api";
import { DidResolver } from "@atproto/identity";
import { and, eq, gt } from "drizzle-orm";

import { buildMutex, db } from "./db";
import { importedDidsT, listItemsT, listsT, relsT } from "./db/schema";

export const getDidAgent = async (did: string) => {
  const out = await new DidResolver({}).resolve(did);
  const endpoint = out?.service?.find(
    (s) => s.id == "#atproto_pds",
  )?.serviceEndpoint;
  return new Agent(`${endpoint ?? "https://bsky.social"}/xrpc`);
};

export const checkIsRecentlyImported = async (did: string, recent?: Date) => {
  if (!recent) {
    recent = new Date();
    recent.setMinutes(recent.getMinutes() - 60);

    const jetskiTime = await db.query.jetskiTimeT.findFirst();
    const isJetksiBehind = !jetskiTime || jetskiTime.time < recent;
    if (isJetksiBehind) return false;
  }

  const importedDid = await db.query.importedDidsT.findFirst({
    where: (t) => and(eq(t.did, did), gt(t.importedAt, recent)),
  });
  return !!importedDid;
};

function isObjKey<T extends object>(key: PropertyKey, obj: T): key is keyof T {
  return key in obj;
}

export const COLLECTION_TABLES = {
  rel: relsT,
  list: listsT,
  listItem: listItemsT,
};
export const getCollectionTable = (s: string) => {
  const key = s.split("my.skylights.").at(1) ?? s;
  return isObjKey(key, COLLECTION_TABLES) ? COLLECTION_TABLES[key] : undefined;
};

export async function upsertRecordRow({
  tx,
  collection,
  did,
  key,
  value,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any;
  did: string;
  collection: string;
  key: string;
  value: unknown;
}) {
  const table = getCollectionTable(collection);
  if (!table) return;
  await (tx ?? db)
    .insert(table)
    .values({ did: did.trim(), key, value })
    .onConflictDoUpdate({
      target: [table.did, table.key],
      set: { value },
    });
}

export async function deleteRecordRow({
  tx,
  collection,
  did,
  key,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any;
  did: string;
  collection: string;
  key: string;
}) {
  const table = getCollectionTable(collection);
  if (!table || !did || !key) return;
  await (tx ?? db)
    .delete(table)
    .where(and(eq(table.did, did), eq(table.key, key)));
}

export const importRepo = async (did: string, recent?: Date) => {
  await buildMutex(`import-repo-${did}`).withLock(async () => {
    await db.transaction(async (db) => {
      if (await checkIsRecentlyImported(did, recent)) {
        console.log("⏭️ skipping import for", did);
        return;
      }
      console.log("♻️ importing", did);

      const agent = await getDidAgent(did);
      const { data } = await agent.com.atproto.sync.getRepo({ did });

      await db.delete(relsT).where(eq(relsT.did, did));
      await db.delete(listsT).where(eq(listsT.did, did));
      await db.delete(listItemsT).where(eq(listItemsT.did, did));

      for (const { collection, rkey: key, record: value } of iterateAtpRepo(
        data,
      )) {
        await upsertRecordRow({ tx: db, did, collection, key, value });
      }

      await db.delete(importedDidsT).where(eq(importedDidsT.did, did));
      await db.insert(importedDidsT).values({ did, importedAt: new Date() });
    });
  });
};

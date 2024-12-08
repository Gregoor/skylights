"use server";

import { and, eq, inArray, sql } from "drizzle-orm";

import { assertSessionAgent } from "@/auth";
import { db } from "@/db";
import { relsT } from "@/db/schema";
import { importRepo } from "@/rels/utils";

export async function findRels(editionKeys: string[]) {
  const session = await assertSessionAgent();
  const did = session.assertDid;
  await importRepo(did);
  return db.query.relsT.findMany({
    where: and(
      eq(relsT.did, did),
      inArray(sql`value->'item'->>'value'`, editionKeys),
    ),
  });
}

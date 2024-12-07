"use server";

import {
  ComAtprotoRepoDeleteRecord,
  ComAtprotoRepoPutRecord,
} from "@atproto/api";
import { and, eq } from "drizzle-orm";

import { assertSessionAgent } from "@/auth";
import { db } from "@/db";
import { relsT } from "@/db/schema";

export async function putRecord(
  data: Pick<
    ComAtprotoRepoPutRecord.InputSchema,
    "collection" | "rkey" | "record"
  >,
) {
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
    .insert(relsT)
    .values({ did, key: data.rkey, value: data.record })
    .onConflictDoUpdate({
      target: [relsT.did, relsT.key],
      set: { value: data.record },
    });
}

export async function deleteRecord(
  data: Pick<ComAtprotoRepoDeleteRecord.InputSchema, "collection" | "rkey">,
) {
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
    .delete(relsT)
    .where(and(eq(relsT.did, did), eq(relsT.key, data.rkey)));
}

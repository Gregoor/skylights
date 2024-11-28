"use server";

import {
  ComAtprotoRepoDeleteRecord,
  ComAtprotoRepoPutRecord,
} from "@atproto/api";

import { assertSessionAgent } from "@/auth";

export async function putRecord(
  data: Pick<
    ComAtprotoRepoPutRecord.InputSchema,
    "collection" | "rkey" | "record"
  >,
) {
  const agent = await assertSessionAgent();
  const inputData = { repo: agent.assertDid, ...data };
  const result = await agent.com.atproto.repo.putRecord(inputData);
  if (!result.success) {
    throw new Error(
      `Failed to put record: ${JSON.stringify(inputData, null, 2)}`,
      { cause: result.data },
    );
  }
}

export async function deleteRecord(
  data: Pick<ComAtprotoRepoDeleteRecord.InputSchema, "collection" | "rkey">,
) {
  const agent = await assertSessionAgent();
  const inputData = { repo: agent.assertDid, ...data };
  const result = await agent.com.atproto.repo.deleteRecord(inputData);
  if (!result.success) {
    throw new Error(
      `Failed to delete record: ${JSON.stringify(inputData, null, 2)}`,
      { cause: result.data },
    );
  }
}

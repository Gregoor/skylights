"use server";
import { getSessionAgent } from "@/auth";
import {
  Record as RelRecord,
  validateRecord,
} from "@/lexicon/types/my/skylights/rel";

export type RelFields = Pick<RelRecord, "rating" | "note">;
export type Rels = Partial<Record<string, RelFields>>;

export async function putRel(rkey: string, record: RelRecord) {
  const agent = await getSessionAgent();
  if (!agent) throw new Error("Missing session");

  const result = validateRecord(record);
  if (!result.success) {
    throw result.error;
  }
  record = result.value as RelRecord;

  await agent.com.atproto.repo.putRecord({
    repo: agent.assertDid,
    collection: "my.skylights.rel",
    rkey,
    record,
  });
}

export async function delRel(rkey: string) {
  const agent = await getSessionAgent();
  if (!agent) throw new Error("Missing session");
  await agent.com.atproto.repo.deleteRecord({
    repo: agent.assertDid,
    collection: "my.skylights.rel",
    rkey,
  });
}

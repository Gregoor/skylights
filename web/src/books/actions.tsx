"use server";
import { TID } from "@atproto/common";

import { getSessionAgent } from "@/auth";
import { Record as RelRecord } from "@/lexicon/types/my/skylights/rel";

export async function rate(key: string, rating: number) {
  const agent = await getSessionAgent();
  if (!agent) throw new Error("Missing session");

  if (
    typeof key != "string" ||
    !(Number.isInteger(rating) && rating >= 0 && rating <= 10)
  ) {
    throw new Error("Invalid input: " + JSON.stringify({ key, rating }));
  }

  const newRecord: RelRecord = {
    item: { ref: "open-library", value: key },
    rating: { value: rating, createdAt: new Date().toISOString() },
  };

  const response = await agent.com.atproto.repo.listRecords({
    repo: agent.assertDid,
    collection: "my.skylights.rel",
    limit: 100,
  });
  for (const record of response.data.records) {
    const rel = record.value as RelRecord;
    if (rel.item.ref == "open-library" && rel.item.value == key) {
      await agent.com.atproto.repo.putRecord({
        repo: agent.assertDid,
        collection: "my.skylights.rel",
        rkey: record.uri.split("/").pop()!,
        record: newRecord,
      });
      return;
    }
  }

  await agent.com.atproto.repo.putRecord({
    repo: agent.assertDid,
    collection: "my.skylights.rel",
    rkey: TID.nextStr(),
    record: newRecord,
    validate: false,
  });
}

export async function unrate(key: string) {
  const agent = await getSessionAgent();
  if (!agent) return;
  const response = await agent.com.atproto.repo.listRecords({
    repo: agent.assertDid,
    collection: "my.skylights.rel",
    limit: 100,
  });
  for (const record of response.data.records) {
    const rel = record.value as RelRecord;
    if (rel.item.ref == "open-library" && rel.item.value == key) {
      await agent.com.atproto.repo.deleteRecord({
        repo: agent.assertDid,
        collection: "my.skylights.rel",
        rkey: record.uri.split("/").pop()!,
      });
    }
  }
}

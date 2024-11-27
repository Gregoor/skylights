"use server";

import { getSessionAgent } from "@/auth";
import { redirect } from "next/navigation";

export async function deleteAll() {
  const agent = await getSessionAgent();
  if (!agent || process.env.NODE_ENV == "production") return;
  const response = await agent.com.atproto.repo.listRecords({
    repo: agent.assertDid,
    collection: "my.skylights.rel",
  });
  for (const record of response.data.records) {
    await agent.com.atproto.repo.deleteRecord({
      repo: agent.assertDid,
      collection: "my.skylights.rel",
      rkey: record.uri.split("/").pop()!,
    });
  }
  redirect("/");
}

import { Agent } from "@atproto/api";
import { cache } from "react";

import { Record as _RelRecord } from "@/lexicon/types/my/skylights/rel";
import { getPublicAgent } from "@/utils";

import type { Book } from "./BookCard";

export type RelRecordValue = _RelRecord;
export type RelRecord = {
  uri: string;
  cid: string;
  value: RelRecordValue;
};

export async function fetchBooks(editionKeys: string[]) {
  const response = await fetch(
    "https://ol.index.skylights.my/indexes/open-library/search",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer k-PR1QX-I9D_52oTVAilHF1nOXvGoMHkhZ2mpA3lmg0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: `edition_key IN ${JSON.stringify(editionKeys)}`,
        limit: editionKeys.length,
      }),
    },
  );
  return (await response.json()).hits as Book[];
}

export const listRels = cache(async (did: string) => {
  if (!did.startsWith("did:plc")) {
    const { data } = await getPublicAgent().resolveHandle({ handle: did });
    did = data.did;
  }
  const out = await fetch(`https://plc.directory/${did}`).then((r) => r.json());
  const endpoint = out.service.find(
    (s: { id: string }) => s.id == "#atproto_pds",
  )?.serviceEndpoint;
  const {
    data: { records },
  } = await new Agent(
    `${endpoint ?? "https://bsky.social"}/xrpc`,
  ).com.atproto.repo.listRecords({
    repo: did,
    collection: "my.skylights.rel",
    limit: 100,
  });
  return records as unknown as RelRecord[];
});

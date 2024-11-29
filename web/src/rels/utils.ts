import { Record as _RelRecord } from "@/lexicon/types/my/skylights/rel";
import { getXRPC_Agent } from "@/utils";

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

export async function listRels(repo: string) {
  const {
    data: { records },
  } = await getXRPC_Agent().com.atproto.repo.listRecords({
    repo,
    collection: "my.skylights.rel",
    limit: 100,
  });
  return records as unknown as RelRecord[];
}

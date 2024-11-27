import { Record as RelRecord } from "@/lexicon/types/my/skylights/rel";
import { getBskyAgent } from "@/utils";
import { Book } from "./BookItem";

export async function fetchBook(workKey: string) {
  const response = await fetch(
    "https://ol.index.skylights.my/indexes/open-library/search",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer k-PR1QX-I9D_52oTVAilHF1nOXvGoMHkhZ2mpA3lmg0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filter: `work_key = '${workKey}'`, limit: 1 }),
    },
  );
  return ((await response.json()) as { hits: Book[] }).hits.at(0);
}

export async function listRels(repo: string) {
  const response = await getBskyAgent().com.atproto.repo.listRecords({
    repo,
    collection: "my.skylights.rel",
    limit: 100,
  });
  return response.data.records;
}

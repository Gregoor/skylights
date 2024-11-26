import { Agent } from "@atproto/api";

import { Rating, Record as RelRecord } from "@/lexicon/types/my/skylights/rel";

import { Book } from "./BookItem";

async function fetchBook(workKey: string) {
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

export async function fetchRatedBooks(repo: string) {
  const agent = new Agent("https://bsky.social/xrpc");
  const response = await agent.com.atproto.repo.listRecords({
    repo,
    collection: "my.skylights.rel",
  });
  const items = await Promise.all(
    (response.data.records.map((record) => record.value) as RelRecord[]).map(
      async ({ item, rating }) => ({
        book: await fetchBook(item.value),
        rating,
      }),
    ),
  );
  return items.filter(
    (i): i is { book: Book; rating: Rating } => !!i.book && !!i.rating,
  );
}

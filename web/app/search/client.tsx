"use client";

import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import { AnimatePresence, motion } from "motion/react";
import { ChangeEvent, useMemo, useState } from "react";
import { merge } from "remeda";
import { debounce } from "ts-debounce";

import { Book, BookCard } from "@/rels/BookCard";
import { RelsLoadingProvider, useRels } from "@/rels/ctx";
import { Card } from "@/ui";

import { findRels } from "./actions";

const {
  InfiniteHits,
  InstantSearch,
  SearchBox,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("react-instantsearch");

const { searchClient } = instantMeiliSearch(
  "https://ol.index.skylights.my",
  "k-PR1QX-I9D_52oTVAilHF1nOXvGoMHkhZ2mpA3lmg0",
  { placeholderSearch: false },
);

function search(requests: Parameters<typeof searchClient.search>[0]) {
  // non-dash query
  const ndq = (requests.at(0)?.params.query ?? "").replaceAll("-", "").trim();
  const isNumeric = ndq
    .split("")
    .every((char) => Number(char).toString() == char);
  if (isNumeric && (ndq.length == 10 || ndq.length == 13)) {
    return searchClient.search([
      {
        indexName: "open-library:rating:desc",
        params: { filters: `isbn_13 = ${ndq} OR isbn_10 = ${ndq}` },
      },
    ]);
  }
  return searchClient.search(requests);
}

const Hit = ({ hit }: { hit: Book }) => (
  <AnimatePresence key={hit.edition_key}>
    <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <BookCard book={hit} />
    </motion.div>
  </AnimatePresence>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeAbortable<F extends (...args: any[]) => any>(fn: F) {
  let lastId;
  return async (
    ...args: Parameters<F>
  ): Promise<[Awaited<ReturnType<F>>, boolean]> => {
    const id = Math.random();
    lastId = id;
    const result = await fn(...args);
    return [result, lastId != id];
  };
}

const findRelsWithAbortable = debounce(makeAbortable(findRels), 300);

export function ClientSearchPage() {
  const { setRels } = useRels();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const searchClient = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async search(requests: any) {
        const responses = await search(requests);
        const editionKeys = (
          responses.results[0] as unknown as {
            hits: { edition_key: string }[];
          }
        ).hits.map((h) => h.edition_key);
        setLoading(true);
        findRelsWithAbortable(editionKeys).then(async (r) => {
          const [rels, aborted] = await r;
          if (aborted) return;
          setLoading(false);
          setRels((prevRels) =>
            merge(
              Object.fromEntries(rels.map((r) => [r.key, r.value])),
              prevRels,
            ),
          );
        });

        return responses;
      },
    }),
    [setRels],
  );

  return (
    <RelsLoadingProvider value={loading}>
      <div className="flex flex-col gap-4">
        <InstantSearch
          indexName="open-library:rating:desc"
          searchClient={searchClient}
        >
          <SearchBox
            classNames={{
              form: [
                "border rounded-lg border-gray-400 focus-within:border-white",
                "transition-all pr-2 flex flex-row gap-2 bg-black",
              ].join(" "),
              input: "outline-none p-2 w-full bg-transparent",
              loadingIndicator: "py-3 scale-75",
              loadingIcon: "stroke-white",
              resetIcon: "fill-white",
              submitIcon: "fill-white",
            }}
            placeholder="Reach for the stars..."
            onChangeCapture={(event: ChangeEvent) => {
              setQuery((event.target as HTMLInputElement).value);
            }}
          />
          <InfiniteHits
            hitComponent={Hit}
            classNames={{
              list: "flex flex-col gap-4",
              disabledLoadMore: "hidden",
              loadMore: query
                ? "mt-2 w-full text-center hover:underline"
                : "hidden",
            }}
            showPrevious={false}
          />
        </InstantSearch>
        <Card>
          Book data is collected from{" "}
          <a
            href="https://openlibrary.org"
            className="text-blue-400 underline hover:opacity-80"
          >
            Open Library
          </a>
          . Please contribute and donate to them to support free and universal
          access to knowledge for everyone.
        </Card>
      </div>
    </RelsLoadingProvider>
  );
}

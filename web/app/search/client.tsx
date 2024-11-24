"use client";
import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import { useHydrateAtoms } from "jotai/utils";
import { useState } from "react";
import { InfiniteHits, InstantSearch, SearchBox } from "react-instantsearch";

import { ratingsAtom } from "@/books/atoms";
import { Book, BookItem } from "@/books/BookItem";
import { Card } from "@/ui";

const { searchClient } = instantMeiliSearch(
  "https://ol.index.skylights.my",
  "k-PR1QX-I9D_52oTVAilHF1nOXvGoMHkhZ2mpA3lmg0",
  { placeholderSearch: false },
);

const Hit = ({ hit }: { hit: Book }) => <BookItem value={hit} />;

export function ClientSearchPage({
  defaultRatings,
}: {
  defaultRatings: Record<string, number>;
}) {
  const [query, setQuery] = useState("");

  useHydrateAtoms([[ratingsAtom, defaultRatings]]);

  return (
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
          onChangeCapture={(event) => {
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
  );
}

"use client";
import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import { useState } from "react";

import { InfiniteHits, InstantSearch, SearchBox } from "react-instantsearch";

const { searchClient } = instantMeiliSearch(
  "https://ol.index.skylights.my",
  "k-PR1QX-I9D_52oTVAilHF1nOXvGoMHkhZ2mpA3lmg0",
);

export function ImgWithDummy(props: React.ComponentProps<"img">) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="border border-gray-400 h-full flex items-center justify-center text-gray-300">
        ?
      </div>
    );
  }

  return (
    <img
      {...props}
      onLoad={(event) => {
        setErrored((event.target as HTMLImageElement).naturalWidth == 1);
      }}
    />
  );
}

function Hit({
  hit,
}: {
  hit: {
    title: string;
    edition_key: string;
    authors: string[];
    isbn_13: string[];
    isbn_10: string[];
  };
}) {
  const isbns = [...hit.isbn_13, ...hit.isbn_10];
  return (
    <article className="border border-gray-700 p-4 flex flex-row gap-4 bg-gray-800">
      <div className="flex-shrink-0 w-24 h-36 ">
        <ImgWithDummy
          className="max-w-full max-h-full object-contain"
          alt={hit.title}
          src={`https://covers.openlibrary.org/b/olid/${hit.edition_key}-M.jpg`}
        />
      </div>
      <div className="w-full flex flex-col">
        <div className="text-lg">
          {hit.title}
          <div className="text-gray-400">{hit.authors?.join(", ")}</div>
        </div>

        {isbns.length > 0 && (
          <span className="mt-auto ml-auto text-sm text-gray-500">
            ISBN{isbns.length > 1 && "s"}: {isbns.join(", ")}
          </span>
        )}
      </div>
    </article>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6">
      <InstantSearch
        indexName="open-library:rating:desc"
        searchClient={searchClient}
      >
        <SearchBox
          classNames={{
            form: "border pr-2 rounded-lg flex flex-row gap-2 bg-black",
            input: "outline-none p-2 w-full bg-transparent",
            loadingIndicator: "py-3 scale-75",
            loadingIcon: "stroke-white",
            resetIcon: "fill-white",
            submitIcon: "fill-white",
          }}
          placeholder="Reach for the stars..."
        />
        <InfiniteHits
          hitComponent={Hit}
          classNames={{
            list: "flex flex-col gap-4",
            disabledLoadMore: "hidden",
            loadMore: "mt-2 w-full text-center hover:underline",
          }}
          showPrevious={false}
        />
      </InstantSearch>
    </div>
  );
}

"use client";

import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import cx from "classix";
import { AnimatePresence, motion } from "motion/react";
import { ChangeEvent, useState } from "react";
import { merge } from "remeda";
import useSWRImmutable from "swr/immutable";
import { debounce } from "ts-debounce";

import { Book, BOOK_KEY, BookCard } from "@/rels/BookCard";
import { RelsLoadingProvider, useRels } from "@/rels/ctx";
import { MOVIE_KEY, MovieCard, TV_SHOW_KEY, TVShowCard } from "@/rels/tmdb";
import { Card } from "@/ui";

import { findRels, searchTMDB } from "./actions";

const { searchClient: booksClient } = instantMeiliSearch(
  "https://ol.index.skylights.my",
  "k-PR1QX-I9D_52oTVAilHF1nOXvGoMHkhZ2mpA3lmg0",
  { placeholderSearch: false },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function searchBooks(requests: any) {
  // non-dash query
  const ndq = (requests.at(0)?.params.query ?? "")
    .replaceAll("-", "")
    .trim() as string;
  const isNumeric = ndq
    .split("")
    .every((char) => Number(char).toString() == char);
  if (isNumeric && (ndq.length == 10 || ndq.length == 13)) {
    return booksClient.search<Book>([
      {
        indexName: "open-library:rating:desc",
        params: { filters: `isbn_13 = ${ndq} OR isbn_10 = ${ndq}` },
      },
    ]);
  }
  return booksClient.search<Book>(requests);
}

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

const RadioBox = ({
  label,
  ...props
}: { label: string } & React.ComponentProps<"input">) => (
  <label
    className={cx(
      "relative border border-white p-1 sm:py-0 h-fit text-center",
      "has-[:checked]:bg-white has-[:checked]:text-black",
      "hover:opacity-80",
    )}
  >
    <input
      type="radio"
      className="left-0 absolute w-full h-full appearance-none cursor-pointer"
      name="category"
      {...props}
    />
    {label}
  </label>
);

const SearchIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490" {...props}>
    <path
      fill="none"
      stroke="white"
      strokeWidth="36"
      strokeLinecap="round"
      d="m280,278a153,153 0 1,0-2,2l170,170m-91-117 110,110-26,26-110-110"
    />
  </svg>
);

export function ClientSearchPage() {
  const { rels, setRels } = useRels();
  const [category, setCategory] = useState<"book" | "movie" | "tv">("book");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data: hits } = useSWRImmutable(
    [category, submittedQuery],
    async ([category, query]) => {
      if (!query) return [];

      if (category == "book") {
        const responses = await searchBooks([
          {
            indexName: "open-library:rating:desc",
            params: { query, hitsPerPage: 10 },
          },
        ]);
        return (
          (responses.results as { hits: Book[] }[])
            .at(0)
            ?.hits.map((book) => ({ type: "book", book }) as const) ?? []
        );
      }

      return searchTMDB(category, query);
    },
    { keepPreviousData: true },
  );
  const { isLoading: isRelsLoading } = useSWRImmutable(
    [
      {
        book: BOOK_KEY,
        movie: MOVIE_KEY,
        tv: TV_SHOW_KEY,
      }[category],
      hits,
    ],
    async ([ref, hits]) => {
      if (!hits?.length) return;
      const keys = hits.map((hit) =>
        hit.type == "book"
          ? hit.book.edition_key
          : (hit.type == "show" ? hit.show : hit.movie).id.toString(),
      );
      const [newRels, aborted] = await findRelsWithAbortable(ref, keys);
      if (aborted) return;
      setRels(
        merge(Object.fromEntries(newRels.map((r) => [r.key, r.value])), rels),
      );
    },
  );

  return (
    <RelsLoadingProvider value={isRelsLoading}>
      <div className="flex flex-col gap-4">
        <form
          className="flex flex-row flex-wrap gap-2 items-center whitespace-pre"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query);
          }}
        >
          <div className="w-full sm:w-fit grid grid-cols-3 gap-2">
            {(
              [
                ["Books", "book"],
                ["Movies", "movie"],
                ["TV", "tv"],
              ] as const
            ).map(([label, value]) => (
              <RadioBox
                key={value}
                label={label}
                value={value}
                checked={category == value}
                onChange={() => setCategory(value)}
              />
            ))}
          </div>
          <div className="flex-grow relative flex flex-row gap-2 max-w-full">
            <input
              type="text"
              className={cx(
                "flex-grow outline-none border rounded-lg border-gray-400",
                "focus:border-white p-2 w-full bg-transparent",
              )}
              placeholder="Reach for the stars..."
              value={query}
              onChange={(event: ChangeEvent) => {
                const { value } = event.target as HTMLInputElement;
                setQuery(value);
                if (category == "book") {
                  setSubmittedQuery(value);
                }
              }}
            />
            <button
              type="submit"
              className={
                category == "book"
                  ? "hidden"
                  : "flex-shrink-0 my-1 border box-border hover:opacity-80"
              }
              style={category == "book" ? {} : { width: 34, height: 34 }}
            />
            <SearchIcon
              className="absolute w-4 pointer-events-none"
              style={{ right: 8, bottom: 13 }}
            />
          </div>
        </form>
        <div className="flex flex-col gap-4">
          {hits?.map((hit) => (
            <AnimatePresence
              key={
                hit.type == "book"
                  ? hit.book.edition_key
                  : (hit.type == "show" ? hit.show : hit.movie).id
              }
            >
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {hit.type == "book" ? (
                  <BookCard book={hit.book} />
                ) : hit.type == "show" ? (
                  <TVShowCard show={hit.show} />
                ) : (
                  <MovieCard movie={hit.movie} />
                )}
              </motion.div>
            </AnimatePresence>
          ))}
        </div>

        {category == "book" ? (
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
        ) : (
          <Card>
            Movie and TV data is collected from{" "}
            <a
              href="https://www.themoviedb.org"
              className="text-blue-400 underline hover:opacity-80"
            >
              The Movie Database
            </a>
            . Please contribute to them to support free and universal access to
            knowledge for everyone.
          </Card>
        )}
      </div>
    </RelsLoadingProvider>
  );
}

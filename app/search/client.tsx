"use client";

import cx from "classix";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { merge } from "remeda";
import useSWRImmutable from "swr/immutable";
import { debounce } from "ts-debounce";

import { Book, BOOK_KEY, BookCard } from "@/rels/BookCard";
import { RelsLoadingProvider, useRels } from "@/rels/ctx";
import { MOVIE_KEY, MovieCard, SHOW_KEY, TVShowCard } from "@/rels/tmdb";
import { Card } from "@/ui";

import { findRels, searchTMDB } from "./actions";

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

  const { data: hits, isLoading: isSearching } = useSWRImmutable(
    [category, submittedQuery],
    async ([category, submittedQuery]) => {
      if (!submittedQuery) return [];

      if (category == "book") {
        // non-dash query
        const ndq = submittedQuery.replaceAll("-", "").trim() as string;
        const isNumeric = ndq
          .split("")
          .every((char) => Number(char).toString() == char);
        const isISBN = isNumeric && (ndq.length == 10 || ndq.length == 13);
        const result = await fetch(
          `https://openlibrary.org/search.json?q=${isISBN ? "isbn:" + ndq : submittedQuery}&fields=key,title,author_name,editions,isbn&limit=20`,
        ).then((r) => r.json());
        return (result as { docs: Book[] }).docs.map(
          (book) => ({ type: "book", book }) as const,
        );
      }

      return searchTMDB(category, submittedQuery);
    },
  );
  const { isLoading: isRelsLoading } = useSWRImmutable(
    [
      {
        book: BOOK_KEY,
        movie: MOVIE_KEY,
        tv: SHOW_KEY,
      }[category],
      hits,
    ],
    async ([ref, hits]) => {
      if (!hits?.length) return;
      const keys = hits.map((hit) =>
        hit.type == "book"
          ? (hit.book.editions.docs.at(0)?.key.split("/").at(2) ?? "")
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
          <div className="flex-grow flex flex-row gap-2 max-w-full">
            <input
              type="text"
              className={cx(
                "flex-grow outline-none border rounded-lg border-gray-400",
                "focus:border-white p-2 w-full bg-transparent",
              )}
              placeholder="Reach for the stars..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
            <button
              type="submit"
              className="flex-shrink-0 my-1 px-2 border box-border hover:opacity-80"
            >
              <SearchIcon className="w-4" />
            </button>
          </div>
        </form>
        {isSearching
          ? "Searching..."
          : submittedQuery && !hits?.length && "No results found"}
        <div className="flex flex-col gap-4">
          {hits?.map((hit) => (
            <AnimatePresence
              key={
                hit.type == "book"
                  ? hit.book.key
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

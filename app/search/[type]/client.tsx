"use client";

import cx from "classix";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { merge } from "remeda";
import useSWRImmutable from "swr/immutable";
import { debounce } from "ts-debounce";

import { Book, BOOK_KEY, BookCard } from "@/items/BookCard";
import { RelsLoadingProvider, useRels } from "@/items/ctx";
import { MOVIE_KEY, MovieCard, SHOW_KEY, TVShowCard } from "@/items/tmdb";
import { Card } from "@/ui";

import { findRels, searchTMDB } from "./actions";
import { SearchType } from "./utils";

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

export function ClientSearchPage({
  searchType,
  query,
}: {
  searchType: SearchType;
  query?: string;
}) {
  const router = useRouter();

  const { rels, setRels } = useRels();
  const [inputValue, setInputValue] = useState(query);

  const { data: hits, isLoading: isSearching } = useSWRImmutable(
    [searchType, query],
    async ([category, query]) => {
      if (!query) return [];

      if (category == "books") {
        // non-dash query
        const ndq = query.replaceAll("-", "").trim() as string;
        const isNumeric = ndq
          .split("")
          .every((char) => Number(char).toString() == char);
        const isISBN = isNumeric && (ndq.length == 10 || ndq.length == 13);
        const result = await fetch(
          `https://openlibrary.org/search.json?q=${isISBN ? "isbn:" + ndq : query}&fields=key,title,author_name,editions,isbn&limit=20`,
        ).then((r) => r.json());
        return (result as { docs: Book[] }).docs.map(
          (book) => ({ type: "book", book }) as const,
        );
      }

      return searchTMDB(category == "movies" ? "movie" : "tv", query);
    },
  );
  const { isLoading: isRelsLoading } = useSWRImmutable(
    [
      {
        books: BOOK_KEY,
        movies: MOVIE_KEY,
        shows: SHOW_KEY,
      }[searchType],
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
      <div className="mx-auto max-w-2xl w-full flex flex-col gap-4">
        <div className="flex flex-row flex-wrap gap-2 items-center whitespace-pre">
          <div className="w-full sm:w-fit grid grid-cols-3 gap-2">
            {(
              [
                ["Books", "books"],
                ["Movies", "movies"],
                ["TV", "shows"],
              ] as const
            ).map(([label, value]) => (
              <Link
                key={value}
                href={`/search/${value}?q=${query ?? ""}`}
                className={cx(
                  "relative border border-white p-1 sm:py-0 h-fit text-center",
                  "hover:opacity-80",
                  searchType == value && "bg-white text-black",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
          <form
            className="flex-grow flex flex-row gap-2 max-w-full"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(`/search/${searchType}?q=${inputValue}`);
            }}
          >
            <input
              type="text"
              className={cx(
                "flex-grow outline-none border rounded-lg border-gray-400",
                "focus:border-white p-2 w-full bg-transparent",
              )}
              placeholder="Reach for the stars..."
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
              }}
            />
            <button
              type="submit"
              className="flex-shrink-0 my-1 px-2 border box-border hover:opacity-80"
            >
              <SearchIcon className="w-4" />
            </button>
          </form>
        </div>
        {isSearching
          ? "Searching..."
          : query && !hits?.length && "No results found"}
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
        <Card className="mx-auto max-w-xl">
          {searchType == "books" ? (
            <>
              Book data is collected from{" "}
              <a
                href="https://openlibrary.org"
                className="text-blue-400 underline hover:opacity-80"
              >
                Open Library
              </a>
              . Please contribute and donate to them to support free and
              universal access to knowledge for everyone.
            </>
          ) : (
            <>
              Movie and TV data is collected from{" "}
              <a
                href="https://www.themoviedb.org"
                className="text-blue-400 underline hover:opacity-80"
              >
                The Movie Database
              </a>
              . Please contribute to them to support free and universal access
              to knowledge for everyone.
            </>
          )}
        </Card>
      </div>
    </RelsLoadingProvider>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { mapValues } from "remeda";

import { BOOK_KEY, BookCard } from "@/rels/BookCard";
import { useRels } from "@/rels/ctx";
import { MOVIE_KEY, MovieCard, TV_SHOW_KEY } from "@/rels/tmdb";
import { UnknownCard } from "@/rels/UnknownCard";

import { findRelsWithInfo, Info, RelsOrderBy } from "./actions";
import { PAGE_SIZE } from "./share";

export function RelList({
  did,
  readonly,
  info: initialInfo,
  total,
  orderBy,
}: {
  did: string;
  readonly: boolean;
  info: Info;
  total: number;
  orderBy: RelsOrderBy;
}) {
  const { rels, setRels } = useRels();
  const [info, setInfo] = useState(initialInfo);

  const pageRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    setLoading(true);
    const newPage = pageRef.current + 1;
    const result = await findRelsWithInfo(did, {
      limit: PAGE_SIZE,
      offset: newPage * PAGE_SIZE,
      orderBy,
    });
    setLoading(false);
    setRels((rels) => ({
      ...rels,
      ...Object.fromEntries(result.rels.map((r) => [r.key, r.value])),
    }));
    setInfo((info) =>
      mapValues(info, (value, key) => ({ ...value, ...result.info[key] })),
    );
    pageRef.current = newPage;
  };

  const hasNextPage = Object.keys(rels).length < total;
  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMore,
    rootMargin: "0px 0px 400px 0px",
  });

  return (
    <>
      {Object.entries(rels).map(([key, rel], i) => {
        const item = rel?.item;
        if (!item) {
          return (
            <UnknownCard key={key} {...{ readonly, uri: key }} rel={rel} />
          );
        }
        return (
          <AnimatePresence key={key}>
            <motion.div
              initial={i < PAGE_SIZE ? undefined : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {
                {
                  [BOOK_KEY]: (
                    <BookCard
                      key={key}
                      book={info.books[item.value]}
                      {...{ readonly }}
                    />
                  ),
                  [MOVIE_KEY]: (
                    <MovieCard
                      key={key}
                      movie={info.movies[Number(item.value)]}
                      {...{ readonly }}
                    />
                  ),
                  [TV_SHOW_KEY]: null,
                }[item.ref as string]
              }
            </motion.div>
          </AnimatePresence>
        );
      })}
      {hasNextPage && <div ref={sentryRef}>Loading...</div>}
    </>
  );
}

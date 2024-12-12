"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";

import { Book, BookCard } from "@/rels/BookCard";
import { useRels } from "@/rels/ctx";
import { UnknownCard } from "@/rels/UnknownCard";

import { findRelsWithBooks, RelsOrderBy } from "./actions";
import { PAGE_SIZE } from "./share";

export function RelList({
  did,
  readonly,
  booksByEditionKey: initialBooksByEditionKey,
  total,
  orderBy,
}: {
  did: string;
  readonly: boolean;
  booksByEditionKey: Record<string, Book>;
  total: number;
  orderBy: RelsOrderBy;
}) {
  const { rels, setRels } = useRels();
  const [booksByEditionKey, setBooksByEditionKey] = useState(
    initialBooksByEditionKey,
  );

  const pageRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    setLoading(true);
    const newPage = pageRef.current + 1;
    const result = await findRelsWithBooks(did, {
      limit: PAGE_SIZE,
      offset: newPage * PAGE_SIZE,
      orderBy,
    });
    setLoading(false);
    setRels((rels) => ({
      ...rels,
      ...Object.fromEntries(result.rels.map((r) => [r.key, r.value])),
    }));
    setBooksByEditionKey((booksByEditionKey) => ({
      ...booksByEditionKey,
      ...result.booksByEditionKey,
    }));
    pageRef.current = newPage;
  };

  const hasNextPage = Object.keys(rels).length < total;
  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMore,
    // rootMargin: "0px 0px 400px 0px",
  });

  return (
    <>
      {Object.entries(rels).map(([key, rel], i) => {
        const editionKey = rel?.item.value;
        const book = editionKey ? booksByEditionKey[editionKey] : undefined;
        return (
          <AnimatePresence key={key}>
            <motion.div
              initial={i < PAGE_SIZE ? undefined : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {book ? (
                <BookCard key={key} {...{ book, readonly }} />
              ) : (
                <UnknownCard key={key} {...{ readonly, uri: key }} rel={rel} />
              )}
            </motion.div>
          </AnimatePresence>
        );
      })}
      {hasNextPage && <div ref={sentryRef}>Loading...</div>}
    </>
  );
}

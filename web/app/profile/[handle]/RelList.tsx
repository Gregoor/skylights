"use client";

import { AnimatePresence, motion } from "motion/react";
import React, {
  useCallback,
  useEffect,
  useInsertionEffect,
  useRef,
  useState,
} from "react";

import { Book, BookCard } from "@/rels/BookCard";
import { useRels } from "@/rels/RelsCtx";
import { UnknownCard } from "@/rels/UnknownCard";

import { findRelsWithBooks } from "./actions";
import { PAGE_SIZE } from "./share";

interface VisibilityProps {
  onChangeVisibility: (visibility: boolean) => void;
  options?: IntersectionObserverInit;
}

function useVisibility(args: VisibilityProps) {
  const ref = useRef(null);
  const handleIntersectionObserver: IntersectionObserverCallback = ([
    entry,
  ]) => {
    args.onChangeVisibility(entry.isIntersecting);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      handleIntersectionObserver,
      args?.options,
    );
    const el = ref.current;
    if (el) {
      observer.observe(el);
      return () => {
        observer.unobserve(el);
      };
    }
  }, [ref, handleIntersectionObserver]);

  return ref;
}

function VisibilityIndicator({
  onChangeVisibility,
  options,
  ...props
}: React.ComponentProps<"div"> & VisibilityProps) {
  const ref = useVisibility({ onChangeVisibility, options });
  return <div ref={ref} {...props} />;
}

// The useEvent API has not yet been added to React,
// so this is a temporary shim.
function useEvent<F extends (...args: any[]) => any>(fn: F) {
  const ref = useRef<F>(null);
  useInsertionEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args: Parameters<F>) => ref.current!(...args), []);
}

export function RelList({
  did,
  readonly,
  booksByEditionKey: initialBooksByEditionKey,
  total,
}: {
  did: string;
  readonly: boolean;
  booksByEditionKey: Record<string, Book>;
  total: number;
}) {
  const { rels, setRels } = useRels();
  const [booksByEditionKey, setBooksByEditionKey] = useState(
    initialBooksByEditionKey,
  );

  const [page, setPage] = useState(0);
  const currentlyFetchingRef = useRef<number | null>(null);
  const fetchMore = useEvent(async () => {
    const newPage = page + 1;
    if (currentlyFetchingRef.current === newPage) return;
    currentlyFetchingRef.current = newPage;

    const result = await findRelsWithBooks(did, {
      limit: PAGE_SIZE,
      offset: newPage * PAGE_SIZE,
    });
    setRels((rels) => ({
      ...rels,
      ...Object.fromEntries(result.rels.map((r) => [r.key, r.value])),
    }));
    setBooksByEditionKey((booksByEditionKey) => ({
      ...booksByEditionKey,
      ...result.booksByEditionKey,
    }));
    setPage(newPage);
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
      {Object.keys(rels).length < total && (
        <VisibilityIndicator
          className="h-32"
          onChangeVisibility={(visible) => {
            if (visible) {
              fetchMore();
            }
          }}
        >
          Loading...
        </VisibilityIndicator>
      )}
    </>
  );
}

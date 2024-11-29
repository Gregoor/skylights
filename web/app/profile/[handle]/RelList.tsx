"use client";

import { useState } from "react";
import { entries, sortBy } from "remeda";

import { Book, BookCard } from "@/rels/BookItem";
import { useRels } from "@/rels/RelsCtx";
import { UnknownCard } from "@/rels/UnknownCard";

export function RelList({
  readonly,
  booksByEditionKey,
}: {
  readonly: boolean;
  booksByEditionKey: Record<string, Book[]>;
}) {
  const { rels } = useRels();
  const [initialRels] = useState(rels);

  // Use initial rels to keep order and presence stable
  return sortBy(
    entries(initialRels),
    ([, rel]) => -(rel?.rating?.value ?? Infinity),
  ).map(([uri]) => {
    const editionKey = rels[uri]?.item.value;
    const book = editionKey ? booksByEditionKey[editionKey]?.at(0) : undefined;
    return book ? (
      <BookCard key={uri} {...{ book, readonly }} />
    ) : (
      <UnknownCard key={uri} uri={uri} rel={rels[uri]} />
    );
  });
}

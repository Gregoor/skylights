"use client";

import { entries, sortBy } from "remeda";

import { Book, BookCard } from "@/rels/BookItem";
import { useRels } from "@/rels/RelsCtx";
import { UnknownCard } from "@/rels/UnknownCard";

export function RelList({
  booksByEditionKey,
}: {
  booksByEditionKey: Record<string, Book[]>;
}) {
  const { rels } = useRels();
  return sortBy(
    entries(rels),
    ([, rel]) => -(rel.rating?.value ?? Infinity),
  ).map(([uri, rel]) => {
    const book = booksByEditionKey[rel.item.value]?.at(0);
    return book ? (
      <BookCard key={uri} book={book} />
    ) : (
      <UnknownCard key={uri} uri={uri} rel={rel} />
    );
  });
}

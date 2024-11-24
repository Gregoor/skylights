"use client";
import { useHydrateAtoms } from "jotai/utils";

import { ratingsAtom } from "@/books/atoms";
import { Book, BookItem } from "@/books/BookItem";

export function RatedBooks({
  ratedBooks,
}: {
  ratedBooks: { book: Book; rating: number }[];
}) {
  useHydrateAtoms([
    [
      ratingsAtom,
      Object.fromEntries(ratedBooks.map((i) => [i.book.work_key, i.rating])),
    ],
  ]);
  return ratedBooks.map(({ book }, i) =>
    book ? <BookItem key={i} value={book} /> : null,
  );
}

"use client";
import { useHydrateAtoms } from "jotai/utils";
import { sortBy } from "remeda";

import type { Rating } from "@/lexicon/types/my/skylights/rel";

import { ratingsAtom } from "@/books/atoms";
import { Book, BookItem } from "@/books/BookItem";

export function RatedBooks({
  ratedBooks,
}: {
  ratedBooks: { book: Book; rating: Rating }[];
}) {
  useHydrateAtoms([
    [
      ratingsAtom,
      Object.fromEntries(
        ratedBooks.map((i) => [i.book.work_key, i.rating.value]),
      ),
    ],
  ]);
  return sortBy(ratedBooks, (i) => -i.rating.value).map(({ book }, i) =>
    book ? <BookItem key={i} value={book} /> : null,
  );
}

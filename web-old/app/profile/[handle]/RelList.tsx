"use client";
import { useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { fromEntries, pick, sortBy } from "remeda";

import { relsAtom, syncRelsEffect } from "@/books/atoms";
import { BookCard } from "@/books/BookItem";
import { RelDetailed } from "@/books/utils";

export function RelList({
  items,
  isOwnProfile,
}: {
  items: RelDetailed[];
  isOwnProfile: boolean;
}) {
  useHydrateAtoms([
    [
      relsAtom,
      fromEntries(
        items.map((item) => [
          item.book.work_key,
          pick(item, ["rating", "note"]),
        ]),
      ),
    ],
  ]);
  useAtom(syncRelsEffect);
  return sortBy(items, (i) => -(i.rating?.value ?? 0)).map(({ book }, i) =>
    book ? <BookCard key={i} book={book} readonly={!isOwnProfile} /> : null,
  );
}

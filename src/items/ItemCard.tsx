import React from "react";

import { Item } from "@/lexicon/types/my/skylights/defs";

import { BaseCard } from "./BaseCard";
import { BOOK_KEY, BookCard } from "./BookCard";
import { Info } from "./info";
import { MOVIE_KEY, MovieCard, SHOW_KEY, TVShowCard } from "./tmdb";

export function ItemCard({
  item,
  info,
  ...props
}: { item?: Item; info: Info } & Pick<
  React.ComponentProps<typeof BaseCard>,
  "readonly" | "reviewer" | "ago" | "children" | "profileHandle"
>) {
  switch (item?.ref) {
    case BOOK_KEY: {
      const book = info.books[item.value];
      return book ? <BookCard book={book} {...props} /> : null;
    }
    case MOVIE_KEY: {
      const movie = info.movies[Number(item.value)];
      return movie ? <MovieCard movie={movie} {...props} /> : null;
    }
    case SHOW_KEY: {
      const show = info.shows[Number(item.value)];
      return show ? <TVShowCard show={show} {...props} /> : null;
    }
    default:
      return null;
  }
}

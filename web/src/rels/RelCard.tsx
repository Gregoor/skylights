import React from "react";

import { BaseCard } from "./BaseCard";
import { BOOK_KEY, BookCard } from "./BookCard";
import { MOVIE_KEY, MovieCard, SHOW_KEY, TVShowCard } from "./tmdb";
import type { Info, RelRecordValue } from "./utils";

export function RelCard({
  item,
  info,
  ...props
}: { item: RelRecordValue["item"]; info: Info } & Pick<
  React.ComponentProps<typeof BaseCard>,
  "readonly" | "reviewer" | "ago" | "children"
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

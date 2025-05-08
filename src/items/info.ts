import { Item } from "@/lexicon/types/my/skylights/defs";

import { Book, BOOK_KEY } from "./BookCard";
import { Movie, MOVIE_KEY, Show, SHOW_KEY } from "./tmdb";

export type Info = {
  books: Record<string, Book>;
  movies: Record<number, Movie>;
  shows: Record<number, Show>;
};

export function getBasicItemFields(item: Item, info: Info) {
  switch (item.ref) {
    case BOOK_KEY: {
      const book = info.books[item.value];
      return book
        ? {
            type: "book",
            title: book.title,
            imageURL: `https://covers.openlibrary.org/b/olid/${book.editions.docs.at(0)?.key.split("/").at(2)}-L.jpg`,
          }
        : null;
    }
    case MOVIE_KEY: {
      const movie = info.movies[Number(item.value)];
      return movie
        ? {
            type: "movie",
            title: `${movie.title} (${new Date(movie.release_date).getFullYear()})`,
            imageURL: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          }
        : null;
    }
    case SHOW_KEY: {
      const show = info.shows[Number(item.value)];
      return show
        ? {
            type: "show",
            title: `${show.name} (${new Date(show.first_air_date).getFullYear()})`,
            imageURL: `https://image.tmdb.org/t/p/w500${show.poster_path}`,
          }
        : null;
    }
    default:
      return null;
  }
}

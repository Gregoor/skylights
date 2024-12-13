import { RelCard, Title } from "./RelCard";

export type Movie = {
  id: number;
  title: string;
  original_language: string;
  release_date: string;
  poster_path?: string;
};

export type Show = {
  id: number;
  name: string;
  original_language: string;
  first_air_date: string;
  poster_path?: string;
};

export const MOVIE_KEY = "tmdb:m";
export const TV_SHOW_KEY = "tmdb:s";

export function MovieCard({
  movie,
  ...props
}: {
  movie: Movie;
} & Omit<
  React.ComponentProps<typeof RelCard>,
  "imgSrc" | "item" | "children"
>) {
  return (
    <RelCard
      imgSrc={`https://image.tmdb.org/t/p/w500${movie.poster_path!}`}
      item={{ ref: MOVIE_KEY, value: `${movie.id}` }}
      {...props}
    >
      <div className="flex flex-row gap-2">
        <Title>{movie.title}</Title>
        <div className="text-gray-400 self-end">
          {new Date(movie.release_date).getFullYear()}
        </div>
      </div>
    </RelCard>
  );
}

export function TVShowCard({
  show,
  ...props
}: {
  show: Show;
} & Omit<
  React.ComponentProps<typeof RelCard>,
  "imgSrc" | "item" | "children"
>) {
  return (
    <RelCard
      imgSrc={`https://image.tmdb.org/t/p/w500${show.poster_path!}`}
      item={{ ref: TV_SHOW_KEY, value: `${show.id}` }}
      {...props}
    >
      <div className="flex flex-row gap-2">
        <Title>{show.name}</Title>
        <div className="text-gray-400 self-end">
          {new Date(show.first_air_date).getFullYear()}
        </div>
      </div>
    </RelCard>
  );
}

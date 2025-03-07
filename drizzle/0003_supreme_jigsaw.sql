CREATE TABLE "tmdb_movies" (
	"id" integer PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmdb_shows" (
	"id" integer PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);

import { sql } from "drizzle-orm";
import {
  char,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
} from "drizzle-orm/pg-core";

export const relsT = pgTable(
  "rels",
  {
    did: char({ length: 32 }),
    key: char({ length: 13 }),
    value: jsonb().notNull(),
    reviewedAt: timestamp("reviewedAt").generatedAlwaysAs(
      sql.raw(
        `GREATEST(${[
          "value->'rating'->>'createdAt'",
          "value->'note'->>'createdAt'",
        ]
          .map((f) => `to_tstz_immutable(${f})`)
          .join(",")})`,
      ),
    ),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.did, t.key] }),
    ratingIdx: sql`value->'rating'->'value'`,
    reviewedAtIdx: index().on(t.reviewedAt),
  }),
);

export const importedDidsT = pgTable("imported_dids", {
  did: char({ length: 32 }).primaryKey(),
  importedAt: timestamp().notNull(),
});

export const jetskiTimeT = pgTable("jetski_time", {
  id: integer().primaryKey().default(42),
  time: timestamp().notNull(),
});

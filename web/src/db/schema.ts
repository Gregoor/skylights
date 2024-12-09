import { sql } from "drizzle-orm";
import {
  char,
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
  },
  (t) => ({
    pk: primaryKey({ columns: [t.did, t.key] }),
    ratingIdx: sql`value->'rating'->'value'`,
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

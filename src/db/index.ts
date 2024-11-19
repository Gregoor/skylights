import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

export const titleIdxDb = drizzle(
  createClient({ url: process.env.OL_TITLE_IDX_DB_URL! }),
);
export const db = drizzle(createClient({ url: process.env.OL_DB_URL! }));

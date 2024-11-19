import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const olEditions = sqliteTable(
  "ol_editions",
  {
    key: text(),
    title: text(),
    number_of_pages: int(),
    work_key: text(),
  },
  (table) => ({ nameIdx: index("title_idx").on(table.title) }),
);

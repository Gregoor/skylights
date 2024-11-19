import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/ol-schema.ts",
  dialect: "sqlite",
  dbCredentials: { url: process.env.OL_DB_URL! },
});

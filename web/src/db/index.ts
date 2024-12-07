import "server-only";

import { Pool } from "@neondatabase/serverless";
import advisoryLock from "advisory-lock";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

const DB_URL = process.env.DB_URL!;

const pool = new Pool({ connectionString: DB_URL });

export const db = drizzle(pool, { schema });
export const buildMutex = advisoryLock(DB_URL);

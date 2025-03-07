import "server-only";

import { Pool } from "@neondatabase/serverless";
import advisoryLock from "advisory-lock";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

const POSTGRES_URL = process.env.POSTGRES_URL!;

const pool = new Pool({ connectionString: POSTGRES_URL });

export const db = drizzle(pool, { schema });
export const buildMutex = advisoryLock(POSTGRES_URL);

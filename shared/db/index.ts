import { Pool } from "@neondatabase/serverless";
import advisoryLock from "advisory-lock";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

const POSTGRES_URL = process.env.POSTGRES_URL!;

const pool = new Pool({ connectionString: POSTGRES_URL });

export const db = drizzle(pool, { schema });

type WithLockFunction = (fn: () => Promise<unknown>) => Promise<unknown>;
type UnlockFn = () => Promise<void>;
export const buildMutex: (lockName: string) => {
  lock: () => Promise<UnlockFn>;
  unlock: UnlockFn;
  tryLock: () => Promise<UnlockFn | undefined>;
  withLock: WithLockFunction;
} = advisoryLock(POSTGRES_URL);

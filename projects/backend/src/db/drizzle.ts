import type { ConfigType } from "@nestjs/config";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { dbConfig } from "../config";
import * as schema from "./schema";

type DbConfig = Pick<ConfigType<typeof dbConfig>, "maxPoolSize" | "url">;

function resolveDatabaseUrl(config: DbConfig): string {
  if (!config.url) {
    throw new Error("DATABASE_URL is not set");
  }

  return config.url;
}

export function createClient(config: DbConfig) {
  const url = resolveDatabaseUrl(config);

  if (typeof config.maxPoolSize === "number" && Number.isFinite(config.maxPoolSize)) {
    return new SQL({
      max: Math.max(1, Math.trunc(config.maxPoolSize)),
      url,
    });
  }

  return new SQL(url);
}

export function createDrizzle(client: SQL) {
  return drizzle({ client, schema });
}

export type DrizzleDB = ReturnType<typeof createDrizzle>;
export type DatabaseClient = ReturnType<typeof createClient>;

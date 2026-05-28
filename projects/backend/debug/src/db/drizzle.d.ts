import type { ConfigType } from "@nestjs/config";
import { SQL } from "bun";
import { dbConfig } from "../config";
import * as schema from "./schema";
type DbConfig = Pick<ConfigType<typeof dbConfig>, "maxPoolSize" | "url">;
export declare function createClient(config: DbConfig): SQL;
export declare function createDrizzle(client: SQL): import("drizzle-orm/bun-sql").BunSQLDatabase<typeof schema> & {
    $client: SQL;
};
export type DrizzleDB = ReturnType<typeof createDrizzle>;
export type DatabaseClient = ReturnType<typeof createClient>;
export {};
//# sourceMappingURL=drizzle.d.ts.map
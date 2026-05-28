import { type OnApplicationShutdown } from "@nestjs/common";
import { type DatabaseClient } from "./drizzle";
export declare class DatabaseModule implements OnApplicationShutdown {
    private readonly client;
    constructor(client: DatabaseClient);
    onApplicationShutdown(): Promise<void>;
}
//# sourceMappingURL=database.module.d.ts.map
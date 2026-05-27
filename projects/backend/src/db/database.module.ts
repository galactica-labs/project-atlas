import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { dbConfig } from "../config";
import { createClient, createDrizzle, type DatabaseClient } from "./drizzle";
import { DRIZZLE } from "./tokens";

@Global()
@Module({
  providers: [
    {
      provide: "DATABASE_CLIENT",
      useFactory: (config: ConfigType<typeof dbConfig>) => createClient(config),
      inject: [dbConfig.KEY],
    },
    {
      provide: DRIZZLE,
      useFactory: (client: DatabaseClient) => createDrizzle(client),
      inject: ["DATABASE_CLIENT"],
      // Repository factories go here
    },
  ],
  exports: [
    "DATABASE_CLIENT",
    DRIZZLE,
    // Repository factories go here
  ],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(
    @Inject("DATABASE_CLIENT")
    private readonly client: DatabaseClient
  ) {}

  async onApplicationShutdown() {
    await this.client.close();
  }
}

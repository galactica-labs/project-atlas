import { registerAs } from "@nestjs/config";

const appConfig = registerAs("app", () => ({
  logLevel: process.env.LOG_LEVEL,
  port: parseInt(process.env.PORT || "3001", 10),
}));

const dbConfig = registerAs("db", () => ({
  maxPoolSize: process.env.DATABASE_MAX_POOL_SIZE
    ? parseInt(process.env.DATABASE_MAX_POOL_SIZE, 10)
    : undefined,
  url: process.env.DATABASE_URL,
}));

const configuration = [appConfig, dbConfig];

export { appConfig, dbConfig };

export default configuration;

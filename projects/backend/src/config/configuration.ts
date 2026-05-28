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

const aiConfig = registerAs("ai", () => ({
  model: process.env.AI_MODEL || "openai/gpt-oss-120b",
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
}));

const engineConfig = registerAs("engine", () => ({
  // atlas_ml FastAPI engine the pipeline bridge proxies to
  url: process.env.ATLAS_ENGINE_URL || "http://localhost:8000",
}));

const configuration = [appConfig, dbConfig, aiConfig, engineConfig];

export { aiConfig, appConfig, dbConfig, engineConfig };

export default configuration;

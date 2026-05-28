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
  openAiApiKey: process.env.OPENAI_API_KEY,
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  realtimeModel: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2",
  realtimeVoice: process.env.OPENAI_REALTIME_VOICE || "marin",
  taskDocsPath: process.env.TASK_DOCS_PATH,
  taskEmbeddingsPath: process.env.TASK_EMBEDDINGS_PATH,
}));

const engineConfig = registerAs("engine", () => ({
  // atlas_ml FastAPI engine the pipeline bridge proxies to
  url: process.env.ATLAS_ENGINE_URL || "http://localhost:8000",
}));

const configuration = [appConfig, dbConfig, aiConfig, engineConfig];

export { aiConfig, appConfig, dbConfig, engineConfig };

export default configuration;

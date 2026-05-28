"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get aiConfig () {
        return aiConfig;
    },
    get appConfig () {
        return appConfig;
    },
    get dbConfig () {
        return dbConfig;
    },
    get default () {
        return _default;
    }
});
const _config = require("@nestjs/config");
const appConfig = (0, _config.registerAs)("app", ()=>({
        logLevel: process.env.LOG_LEVEL,
        port: parseInt(process.env.PORT || "3001", 10)
    }));
const dbConfig = (0, _config.registerAs)("db", ()=>({
        maxPoolSize: process.env.DATABASE_MAX_POOL_SIZE ? parseInt(process.env.DATABASE_MAX_POOL_SIZE, 10) : undefined,
        url: process.env.DATABASE_URL
    }));
const aiConfig = (0, _config.registerAs)("ai", ()=>({
        model: process.env.AI_MODEL || "openai/gpt-oss-120b",
        openRouterApiKey: process.env.OPENROUTER_API_KEY
    }));
const configuration = [
    appConfig,
    dbConfig,
    aiConfig
];
const _default = configuration;

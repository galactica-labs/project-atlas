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
    get createClient () {
        return createClient;
    },
    get createDrizzle () {
        return createDrizzle;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _bun = require("bun");
const _bunsql = require("drizzle-orm/bun-sql");
const _schema = /*#__PURE__*/ _interop_require_wildcard._(require("./schema"));
function resolveDatabaseUrl(config) {
    if (!config.url) {
        throw new Error("DATABASE_URL is not set");
    }
    return config.url;
}
function createClient(config) {
    const url = resolveDatabaseUrl(config);
    if (typeof config.maxPoolSize === "number" && Number.isFinite(config.maxPoolSize)) {
        return new _bun.SQL({
            max: Math.max(1, Math.trunc(config.maxPoolSize)),
            url
        });
    }
    return new _bun.SQL(url);
}
function createDrizzle(client) {
    return (0, _bunsql.drizzle)({
        client,
        schema: _schema
    });
}

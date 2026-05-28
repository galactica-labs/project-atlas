"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DatabaseModule", {
    enumerable: true,
    get: function() {
        return DatabaseModule;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _ts_param = require("@swc/helpers/_/_ts_param");
const _common = require("@nestjs/common");
const _config = require("../config");
const _repositories = require("./repositories");
const _drizzle = require("./drizzle");
const _tokens = require("./tokens");
let DatabaseModule = class DatabaseModule {
    client;
    constructor(client){
        this.client = client;
    }
    async onApplicationShutdown() {
        await this.client.close();
    }
};
DatabaseModule = _ts_decorate._([
    (0, _common.Global)(),
    (0, _common.Module)({
        providers: [
            {
                provide: "DATABASE_CLIENT",
                useFactory: (config)=>(0, _drizzle.createClient)(config),
                inject: [
                    _config.dbConfig.KEY
                ]
            },
            {
                provide: _tokens.DRIZZLE,
                useFactory: (client)=>(0, _drizzle.createDrizzle)(client),
                inject: [
                    "DATABASE_CLIENT"
                ]
            },
            _repositories.ImportBatchRepository,
            _repositories.ComponentCatalogRepository
        ],
        exports: [
            "DATABASE_CLIENT",
            _tokens.DRIZZLE,
            _repositories.ImportBatchRepository,
            _repositories.ComponentCatalogRepository
        ]
    }),
    _ts_param._(0, (0, _common.Inject)("DATABASE_CLIENT")),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof DatabaseClient === "undefined" ? Object : DatabaseClient
    ])
], DatabaseModule);

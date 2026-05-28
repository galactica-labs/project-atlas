"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _config1 = /*#__PURE__*/ _interop_require_default._(require("./config"));
const _db = require("./db");
const _docs = require("./docs");
const _importflow = require("./import-flow");
let AppModule = class AppModule {
};
AppModule = _ts_decorate._([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule.forRoot({
                load: [
                    ..._config1.default
                ],
                isGlobal: true,
                cache: true
            }),
            _db.DatabaseModule,
            _docs.DocsModule,
            _importflow.ImportFlowModule
        ],
        controllers: [],
        providers: []
    })
], AppModule);

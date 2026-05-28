"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DocsModule", {
    enumerable: true,
    get: function() {
        return DocsModule;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _common = require("@nestjs/common");
const _docscontroller = require("./docs.controller");
const _docsservice = require("./docs.service");
let DocsModule = class DocsModule {
};
DocsModule = _ts_decorate._([
    (0, _common.Module)({
        controllers: [
            _docscontroller.DocsController
        ],
        providers: [
            _docsservice.DocsService
        ],
        exports: [
            _docsservice.DocsService
        ]
    })
], DocsModule);

"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DocsController", {
    enumerable: true,
    get: function() {
        return DocsController;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _ts_param = require("@swc/helpers/_/_ts_param");
const _common = require("@nestjs/common");
const _docsservice = require("./docs.service");
let DocsController = class DocsController {
    docsService;
    constructor(docsService){
        this.docsService = docsService;
    }
    getOpenApi() {
        const document = this.docsService.getDocument();
        if (!document) {
            throw new _common.InternalServerErrorException("OpenAPI document not initialized");
        }
        return document;
    }
    getReference(req, res, next) {
        return this.docsService.getReferenceHandler()(req, res, next);
    }
};
_ts_decorate._([
    (0, _common.Get)("openapi"),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", []),
    _ts_metadata._("design:returntype", void 0)
], DocsController.prototype, "getOpenApi", null);
_ts_decorate._([
    (0, _common.Get)("reference"),
    _ts_param._(0, (0, _common.Req)()),
    _ts_param._(1, (0, _common.Res)()),
    _ts_param._(2, (0, _common.Next)()),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        typeof Response === "undefined" ? Object : Response,
        typeof NextFunction === "undefined" ? Object : NextFunction
    ]),
    _ts_metadata._("design:returntype", void 0)
], DocsController.prototype, "getReference", null);
DocsController = _ts_decorate._([
    (0, _common.Controller)(),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof _docsservice.DocsService === "undefined" ? Object : _docsservice.DocsService
    ])
], DocsController);

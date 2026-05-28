"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DocsService", {
    enumerable: true,
    get: function() {
        return DocsService;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _common = require("@nestjs/common");
const _nestjsapireference = require("@scalar/nestjs-api-reference");
let DocsService = class DocsService {
    document = null;
    referenceHandler = (0, _nestjsapireference.apiReference)({
        url: "/api/openapi"
    });
    setDocument(document) {
        this.document = document;
    }
    getDocument() {
        return this.document;
    }
    getReferenceHandler() {
        return this.referenceHandler;
    }
};
DocsService = _ts_decorate._([
    (0, _common.Injectable)()
], DocsService);

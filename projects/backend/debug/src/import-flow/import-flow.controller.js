"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImportFlowController", {
    enumerable: true,
    get: function() {
        return ImportFlowController;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _ts_param = require("@swc/helpers/_/_ts_param");
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _swagger = require("@nestjs/swagger");
const _importflowresponsedto = require("./dto/import-flow-response.dto");
const _reviewimportbatchdto = require("./dto/review-import-batch.dto");
const _importflowservice = require("./import-flow.service");
let ImportFlowController = class ImportFlowController {
    importFlowService;
    constructor(importFlowService){
        this.importFlowService = importFlowService;
    }
    pullFromIngress() {
        return this.importFlowService.pullFromIngress();
    }
    getBatch(batchId) {
        return this.importFlowService.getBatch(batchId);
    }
    runMatching(batchId) {
        return this.importFlowService.runMatching(batchId);
    }
    submitReview(batchId, body) {
        return this.importFlowService.submitReview(batchId, body);
    }
    uploadDocument(batchId, itemId, file) {
        return this.importFlowService.uploadDocument(batchId, itemId, file);
    }
    commitBatch(batchId) {
        return this.importFlowService.commitBatch(batchId);
    }
};
_ts_decorate._([
    (0, _common.Post)("ingress/pull"),
    (0, _swagger.ApiCreatedResponse)({
        type: _importflowresponsedto.ImportBatchResponseDto
    }),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", []),
    _ts_metadata._("design:returntype", void 0)
], ImportFlowController.prototype, "pullFromIngress", null);
_ts_decorate._([
    (0, _common.Get)(":batchId"),
    (0, _swagger.ApiOkResponse)({
        type: _importflowresponsedto.ImportBatchResponseDto
    }),
    _ts_param._(0, (0, _common.Param)("batchId")),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        String
    ]),
    _ts_metadata._("design:returntype", void 0)
], ImportFlowController.prototype, "getBatch", null);
_ts_decorate._([
    (0, _common.Post)(":batchId/match"),
    (0, _swagger.ApiCreatedResponse)({
        type: _importflowresponsedto.ImportBatchResponseDto
    }),
    _ts_param._(0, (0, _common.Param)("batchId")),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        String
    ]),
    _ts_metadata._("design:returntype", void 0)
], ImportFlowController.prototype, "runMatching", null);
_ts_decorate._([
    (0, _common.Post)(":batchId/review"),
    (0, _swagger.ApiCreatedResponse)({
        type: _importflowresponsedto.ImportBatchResponseDto
    }),
    _ts_param._(0, (0, _common.Param)("batchId")),
    _ts_param._(1, (0, _common.Body)()),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        String,
        typeof _reviewimportbatchdto.ReviewImportBatchDto === "undefined" ? Object : _reviewimportbatchdto.ReviewImportBatchDto
    ]),
    _ts_metadata._("design:returntype", void 0)
], ImportFlowController.prototype, "submitReview", null);
_ts_decorate._([
    (0, _common.Post)(":batchId/items/:itemId/documents"),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file", {
        limits: {
            fileSize: 15 * 1024 * 1024
        }
    })),
    (0, _swagger.ApiConsumes)("multipart/form-data"),
    (0, _swagger.ApiBody)({
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary"
                }
            },
            required: [
                "file"
            ]
        }
    }),
    (0, _swagger.ApiCreatedResponse)({
        type: _importflowresponsedto.ImportBatchResponseDto
    }),
    _ts_param._(0, (0, _common.Param)("batchId")),
    _ts_param._(1, (0, _common.Param)("itemId")),
    _ts_param._(2, (0, _common.UploadedFile)()),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata._("design:returntype", void 0)
], ImportFlowController.prototype, "uploadDocument", null);
_ts_decorate._([
    (0, _common.Post)(":batchId/commit"),
    (0, _swagger.ApiCreatedResponse)({
        type: _importflowresponsedto.CommitImportBatchResponseDto
    }),
    _ts_param._(0, (0, _common.Param)("batchId")),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        String
    ]),
    _ts_metadata._("design:returntype", void 0)
], ImportFlowController.prototype, "commitBatch", null);
ImportFlowController = _ts_decorate._([
    (0, _swagger.ApiTags)("Genesis"),
    (0, _common.Controller)("import-flows"),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof _importflowservice.ImportFlowService === "undefined" ? Object : _importflowservice.ImportFlowService
    ])
], ImportFlowController);

"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReviewImportBatchDto", {
    enumerable: true,
    get: function() {
        return ReviewImportBatchDto;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _swagger = require("@nestjs/swagger");
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
let ImportItemReviewDto = class ImportItemReviewDto {
    itemId;
    technicianDecision;
    technicianNotes;
    normalizedName;
    category;
};
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        format: "uuid"
    }),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata._("design:type", String)
], ImportItemReviewDto.prototype, "itemId", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        enum: [
            "confirmed",
            "edited",
            "needs-doc"
        ]
    }),
    (0, _classvalidator.IsIn)([
        "confirmed",
        "edited",
        "needs-doc"
    ]),
    _ts_metadata._("design:type", String)
], ImportItemReviewDto.prototype, "technicianDecision", void 0);
_ts_decorate._([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata._("design:type", String)
], ImportItemReviewDto.prototype, "technicianNotes", void 0);
_ts_decorate._([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata._("design:type", String)
], ImportItemReviewDto.prototype, "normalizedName", void 0);
_ts_decorate._([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata._("design:type", String)
], ImportItemReviewDto.prototype, "category", void 0);
let ReviewImportBatchDto = class ReviewImportBatchDto {
    items;
};
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        type: [
            ImportItemReviewDto
        ]
    }),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMinSize)(1),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>ImportItemReviewDto),
    _ts_metadata._("design:type", Array)
], ReviewImportBatchDto.prototype, "items", void 0);

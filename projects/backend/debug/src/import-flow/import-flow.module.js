"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImportFlowModule", {
    enumerable: true,
    get: function() {
        return ImportFlowModule;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _common = require("@nestjs/common");
const _importflowcontroller = require("./import-flow.controller");
const _importmatchingservice = require("./import-matching.service");
const _importflowservice = require("./import-flow.service");
const _ingresscontrollerservice = require("./ingress-controller.service");
let ImportFlowModule = class ImportFlowModule {
};
ImportFlowModule = _ts_decorate._([
    (0, _common.Module)({
        controllers: [
            _importflowcontroller.ImportFlowController
        ],
        providers: [
            _importflowservice.ImportFlowService,
            _importmatchingservice.ImportMatchingService,
            _ingresscontrollerservice.IngressControllerService
        ]
    })
], ImportFlowModule);

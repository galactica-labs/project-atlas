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
        return _configuration.aiConfig;
    },
    get appConfig () {
        return _configuration.appConfig;
    },
    get dbConfig () {
        return _configuration.dbConfig;
    },
    get default () {
        return _configuration.default;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _configuration = /*#__PURE__*/ _interop_require_wildcard._(require("./configuration"));

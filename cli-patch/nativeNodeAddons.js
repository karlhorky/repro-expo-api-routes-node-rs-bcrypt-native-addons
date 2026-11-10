"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    NATIVE_ADDON_EXPORT_PREFIX: null,
    createNativeAddonLoader: null,
    getNativeAddonId: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get NATIVE_ADDON_EXPORT_PREFIX () {
        return NATIVE_ADDON_EXPORT_PREFIX;
    },
    get createNativeAddonLoader () {
        return createNativeAddonLoader;
    },
    get getNativeAddonId () {
        return getNativeAddonId;
    }
});
function _nodecrypto() {
    const data = require("node:crypto");
    _nodecrypto = function() {
        return data;
    };
    return data;
}
const NATIVE_ADDON_EXPORT_PREFIX = '\0node-addon-export:';
function getNativeAddonId(filePath) {
    return (0, _nodecrypto().createHash)('sha256').update(filePath).digest('hex');
}
function createNativeAddonLoader(filenames) {
    return `function __expo_require_native__(id){const filenames=${JSON.stringify(filenames)};return $$require_external($$require_external("node:path").resolve(__dirname,filenames[id]));}\n`;
}

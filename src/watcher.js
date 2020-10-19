"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFile = exports.getProgram = void 0;
var ts = require("typescript");
var typescript_1 = require("typescript");
var formatHost = {
    getCanonicalFileName: function (path) { return path; },
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: function () { return ts.sys.newLine; }
};
var watchProgram = null;
var inMemoryUpdatedSources = {};
var callbacks = {};
function getProgram() {
    if (!watchProgram) {
        watchProgram = watchMain();
    }
    return watchProgram.getProgram().getProgram();
}
exports.getProgram = getProgram;
function updateFile(filename, sourceText) {
    if (!watchProgram) {
        watchProgram = watchMain();
    }
    if (!callbacks[filename]) {
        throw new Error("Watcher callback for " + filename + " was not set");
    }
    inMemoryUpdatedSources[filename] = sourceText;
    callbacks[filename](filename, typescript_1.FileWatcherEventKind.Changed);
}
exports.updateFile = updateFile;
function watchMain() {
    var config = ts.findConfigFile("./", ts.sys.fileExists, "tsconfig.json");
    if (!config) {
        throw new Error("Could not find a valid 'tsconfig.json'.");
    }
    var createProgram = ts.createSemanticDiagnosticsBuilderProgram;
    var host = ts.createWatchCompilerHost(config, {}, ts.sys, createProgram, reportDiagnostic, reportWatchStatusChanged);
    var origCreateProgram = host.createProgram;
    host.createProgram = function (rootNames, options, host, oldProgram) {
        console.log("** We're about to create the program! **");
        return origCreateProgram(rootNames, options, host, oldProgram);
    };
    var origPostProgramCreate = host.afterProgramCreate;
    host.afterProgramCreate = function (program) {
        console.log("** We finished making the program! **");
        origPostProgramCreate(program);
    };
    var origWatchFile = host.watchFile;
    host.watchFile = function (path, callback, pollingInterval, options) {
        callbacks[path] = callback;
        return origWatchFile(path, callback, pollingInterval, options);
    };
    var origReadFile = host.readFile;
    host.readFile = function (path, encoding) {
        if (inMemoryUpdatedSources[path]) {
            console.log("** Reading file " + path + " from in memory updated sources **");
            var result = inMemoryUpdatedSources[path];
            delete inMemoryUpdatedSources[path];
            return result;
        }
        console.log("** Reading file " + path + " from file system");
        return origReadFile(path, encoding);
    };
    return ts.createWatchProgram(host);
}
function reportDiagnostic(diagnostic) {
    console.error("Error", diagnostic.code, ":", ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()));
}
function reportWatchStatusChanged(diagnostic) {
    console.info(ts.formatDiagnostic(diagnostic, formatHost));
}
//# sourceMappingURL=watcher.js.map
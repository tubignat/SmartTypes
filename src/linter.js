"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintFile = void 0;
var ts = require("typescript");
var typescript_1 = require("typescript");
var watcher_1 = require("./watcher");
var SmartTypeName = "SmartType";
function searchForSmartTypeAliases(sourceFile, errors, checker) {
    var aliases = [];
    searchRecursive(sourceFile);
    function searchRecursive(node) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (node.kind === ts.SyntaxKind.TypeAliasDeclaration && ((_b = (_a = node["type"]) === null || _a === void 0 ? void 0 : _a["typeName"]) === null || _b === void 0 ? void 0 : _b["escapedText"]) === SmartTypeName) {
            var symbolId = (_c = checker.getTypeAtLocation(node).aliasSymbol) === null || _c === void 0 ? void 0 : _c["id"];
            var aliasNode = node;
            var aliasName = aliasNode.name.escapedText;
            var type = checker.getTypeAtLocation((_d = aliasNode.type["typeArguments"]) === null || _d === void 0 ? void 0 : _d[0]);
            if (type.symbol.flags !== typescript_1.SymbolFlags.Function) {
                errors.push({
                    message: "Incorrect validator parameter",
                    pos: (_e = aliasNode.type["typeArguments"]) === null || _e === void 0 ? void 0 : _e[0].pos,
                    end: (_f = aliasNode.type["typeArguments"]) === null || _f === void 0 ? void 0 : _f[0].end
                });
            }
            else {
                var validatorNode = type.symbol.valueDeclaration;
                var text = (_g = validatorNode.body) === null || _g === void 0 ? void 0 : _g.statements.map(function (statement) { return statement.getFullText(); }).join("\n");
                if (text) {
                    var validator_1 = new Function(validatorNode.parameters[0].name["escapedText"], ts.transpile(text));
                    aliases.push({ name: aliasName, symbolId: symbolId, validator: function (value) { return validator_1(value); } });
                }
            }
        }
        ts.forEachChild(node, searchRecursive);
    }
    return aliases;
}
function lint(sourceFile, checker, aliases, errors) {
    lintRecursive(sourceFile);
    function lintRecursive(node) {
        var _a, _b, _c, _d;
        switch (node.kind) {
            case ts.SyntaxKind.CallExpression:
                var expr_1 = node;
                (_c = (_b = (_a = checker.getTypeAtLocation(node['expression'])
                    .symbol) === null || _a === void 0 ? void 0 : _a.valueDeclaration) === null || _b === void 0 ? void 0 : _b["parameters"]) === null || _c === void 0 ? void 0 : _c.map(function (param, i) {
                    return {
                        node: expr_1.arguments[i],
                        smartType: aliases.find(function (a) { var _a, _b; return a.name === ((_b = (_a = param["type"]) === null || _a === void 0 ? void 0 : _a["typeName"]) === null || _b === void 0 ? void 0 : _b["escapedText"]); })
                    };
                }).filter(function (param) { return param.node && param.smartType; }).forEach(function (param) { return validateCast(param.node, param.smartType); });
                break;
            case ts.SyntaxKind.AsExpression:
                var typeId_1 = (_d = checker.getTypeAtLocation(node).aliasSymbol) === null || _d === void 0 ? void 0 : _d["id"];
                var smartType = aliases.find(function (a) { return a.symbolId === typeId_1; });
                if (smartType) {
                    validateCast(node["expression"], smartType);
                }
                break;
        }
        ts.forEachChild(node, lintRecursive);
    }
    function validateCast(node, smartType) {
        var _a, _b, _c, _d;
        if (node.kind === ts.SyntaxKind.NumericLiteral || node.kind === ts.SyntaxKind.StringLiteral) {
            runValidation(node, smartType, checker.getTypeAtLocation(node)["value"]);
        }
        if (node.kind === ts.SyntaxKind.CallExpression) {
            var typeId = (_a = checker.getTypeAtLocation(node).aliasSymbol) === null || _a === void 0 ? void 0 : _a["id"];
            if (typeId !== smartType.symbolId) {
                errors.push({
                    message: ((_b = node["expression"]) === null || _b === void 0 ? void 0 : _b["escapedText"]) + " is not guaranteed to return a valid " + smartType.name,
                    pos: node.pos,
                    end: node.end
                });
            }
        }
        if (node.kind === ts.SyntaxKind.AsExpression) {
            var type = checker.getTypeAtLocation(node);
            var typeId = (_c = type.aliasSymbol) === null || _c === void 0 ? void 0 : _c["id"];
            if (typeId !== smartType.symbolId) {
                errors.push({
                    message: "Cannot use type " + type["intrinsicName"] + " instead of " + smartType.name,
                    pos: node["type"].pos,
                    end: node["type"].end
                });
            }
        }
        if (node.kind === ts.SyntaxKind.Identifier) {
            var type = checker.getTypeAtLocation(node);
            if (type.flags === typescript_1.TypeFlags.NumberLiteral || type.flags === typescript_1.TypeFlags.StringLiteral) {
                runValidation(node, smartType, type["value"]);
            }
            else if (((_d = type.aliasSymbol) === null || _d === void 0 ? void 0 : _d["id"]) !== smartType.symbolId) {
                errors.push({
                    message: node["escapedText"] + " is not guaranteed to be a valid " + smartType.name,
                    pos: node.pos,
                    end: node.end
                });
            }
        }
    }
    function runValidation(node, smartType, value) {
        var validation = smartType.validator(value);
        if (!validation["isValid"]) {
            errors.push({ message: validation["message"], pos: node.pos, end: node.end });
        }
    }
}
function lintFile(fileName, sourceText) {
    watcher_1.updateFile(fileName, sourceText);
    var program = watcher_1.getProgram();
    var checker = program.getTypeChecker();
    var errors = [];
    var sourceFile = program.getSourceFile(fileName);
    if (sourceFile) {
        var aliases = searchForSmartTypeAliases(sourceFile, errors, checker);
        lint(sourceFile, checker, aliases, errors);
    }
    return errors;
}
exports.lintFile = lintFile;
//# sourceMappingURL=linter.js.map
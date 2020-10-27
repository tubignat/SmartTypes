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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (node.kind === ts.SyntaxKind.TypeAliasDeclaration && ((_b = (_a = node["type"]) === null || _a === void 0 ? void 0 : _a["typeName"]) === null || _b === void 0 ? void 0 : _b["escapedText"]) === SmartTypeName) {
            var symbolId = (_d = (_c = checker.getTypeAtLocation(node)) === null || _c === void 0 ? void 0 : _c.aliasSymbol) === null || _d === void 0 ? void 0 : _d["id"];
            var aliasNode = node;
            var aliasName = aliasNode.name.escapedText;
            var type = checker.getTypeAtLocation((_e = aliasNode.type["typeArguments"]) === null || _e === void 0 ? void 0 : _e[0]);
            if (((_f = type === null || type === void 0 ? void 0 : type.symbol) === null || _f === void 0 ? void 0 : _f.flags) !== typescript_1.SymbolFlags.Function) {
                errors.push({
                    message: "Incorrect validator parameter",
                    pos: (_g = aliasNode.type["typeArguments"]) === null || _g === void 0 ? void 0 : _g[0].pos,
                    end: (_h = aliasNode.type["typeArguments"]) === null || _h === void 0 ? void 0 : _h[0].end
                });
            }
            else {
                var validatorNode = (_j = type.symbol) === null || _j === void 0 ? void 0 : _j.valueDeclaration;
                var text = (_k = validatorNode.body) === null || _k === void 0 ? void 0 : _k.statements.map(function (statement) { return statement.getFullText(); }).join("\n");
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        if (node.kind === ts.SyntaxKind.ReturnStatement) {
            var parentFunc = getParentFunction(node);
            var smartType = getSmartTypeOrUndefined(parentFunc === null || parentFunc === void 0 ? void 0 : parentFunc["type"]);
            if (smartType) {
                validateCast(node["expression"], smartType);
            }
            else {
                var struct = getStructWithSmartTypesOrUndefined(parentFunc === null || parentFunc === void 0 ? void 0 : parentFunc["type"]);
                if (struct) {
                    validateStructCast(node["expression"], struct);
                }
            }
        }
        else if (node.kind === ts.SyntaxKind.CallExpression) {
            var expr_1 = node;
            (_d = (_c = (_b = (_a = checker.getTypeAtLocation(node['expression'])) === null || _a === void 0 ? void 0 : _a.symbol) === null || _b === void 0 ? void 0 : _b.valueDeclaration) === null || _c === void 0 ? void 0 : _c["parameters"]) === null || _d === void 0 ? void 0 : _d.map(function (param, i) {
                return {
                    node: expr_1.arguments[i],
                    smartType: getSmartTypeOrUndefined(param),
                    structWithSmartType: getStructWithSmartTypesOrUndefined(param)
                };
            }).filter(function (param) { return param.node && (param.smartType || param.structWithSmartType); }).forEach(function (param) {
                if (param.smartType) {
                    validateCast(param.node, param.smartType);
                }
                else {
                    validateStructCast(param.node, param.structWithSmartType);
                }
            });
        }
        else if (node.kind === ts.SyntaxKind.AsExpression) {
            var smartType = getSmartTypeOrUndefined(node);
            if (smartType) {
                validateCast(node["expression"], smartType);
            }
            else {
                var struct = getStructWithSmartTypesOrUndefined(node);
                if (struct) {
                    validateStructCast(node["expression"], struct);
                }
            }
        }
        else if (node.kind === ts.SyntaxKind.VariableDeclaration) {
            var smartType = getSmartTypeOrUndefined(node);
            if (smartType && node["initializer"]) {
                validateCast(node["initializer"], smartType);
            }
            else {
                var struct = getStructWithSmartTypesOrUndefined(node);
                if (struct) {
                    validateStructCast(node["initializer"], struct);
                }
            }
        }
        else if (node.kind === ts.SyntaxKind.ExpressionStatement && ((_f = (_e = node["expression"]) === null || _e === void 0 ? void 0 : _e.operatorToken) === null || _f === void 0 ? void 0 : _f.kind) === ts.SyntaxKind.EqualsToken) {
            var smartType = getSmartTypeOrUndefined((_g = node["expression"]) === null || _g === void 0 ? void 0 : _g.left);
            if (smartType && ((_h = node["expression"]) === null || _h === void 0 ? void 0 : _h.right)) {
                validateCast((_j = node["expression"]) === null || _j === void 0 ? void 0 : _j.right, smartType);
            }
            else {
                var struct = getStructWithSmartTypesOrUndefined((_k = node["expression"]) === null || _k === void 0 ? void 0 : _k.left);
                if (struct) {
                    validateStructCast((_l = node["expression"]) === null || _l === void 0 ? void 0 : _l.right, struct);
                }
            }
        }
        else if (node.kind === ts.SyntaxKind.NewExpression) {
            var expr_2 = node;
            var params = (_o = (_m = checker.getTypeAtLocation(node["expression"]).getConstructSignatures()) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.parameters;
            if (params) {
                params
                    .map(function (param, i) {
                    var _a;
                    return {
                        node: (_a = expr_2.arguments) === null || _a === void 0 ? void 0 : _a[i], smartType: getSmartTypeOrUndefined(param === null || param === void 0 ? void 0 : param.valueDeclaration)
                    };
                })
                    .forEach(function (param) { return param.node && param.smartType && validateCast(param.node, param.smartType); });
            }
        }
        ts.forEachChild(node, lintRecursive);
    }
    function validateCast(node, smartType) {
        var _a, _b, _c, _d, _e, _f;
        if (node.kind === ts.SyntaxKind.NumericLiteral || node.kind === ts.SyntaxKind.StringLiteral) {
            runValidation(node, smartType, checker.getTypeAtLocation(node)["value"]);
        }
        if (node.kind === ts.SyntaxKind.CallExpression) {
            var declaredReturnType = (_a = checker.getTypeAtLocation(node["expression"]).symbol) === null || _a === void 0 ? void 0 : _a.valueDeclaration["type"];
            var typeId = (_b = checker.getTypeAtLocation(declaredReturnType).aliasSymbol) === null || _b === void 0 ? void 0 : _b["id"];
            if (typeId !== smartType.symbolId) {
                errors.push({
                    message: ((_c = node["expression"]) === null || _c === void 0 ? void 0 : _c["escapedText"]) + " is not guaranteed to return a valid " + smartType.name,
                    pos: node.pos,
                    end: node.end
                });
            }
        }
        if (node.kind === ts.SyntaxKind.AsExpression) {
            var type = checker.getTypeAtLocation(node);
            var typeId = (_d = type.aliasSymbol) === null || _d === void 0 ? void 0 : _d["id"];
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
            else if (((_e = type.aliasSymbol) === null || _e === void 0 ? void 0 : _e["id"]) !== smartType.symbolId) {
                errors.push({
                    message: node["escapedText"] + " is not guaranteed to be a valid " + smartType.name,
                    pos: node.pos,
                    end: node.end
                });
            }
        }
        if (node.kind === ts.SyntaxKind.BinaryExpression && ((_f = checker.getTypeAtLocation(node).aliasSymbol) === null || _f === void 0 ? void 0 : _f["id"]) !== smartType.symbolId) {
            errors.push({
                message: "Expression is not guaranteed to be a valid " + smartType.name,
                pos: node.pos,
                end: node.end
            });
        }
    }
    function validateStructCast(node, castedTo) {
        if (node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            var type_1 = checker.getTypeAtLocation(node);
            castedTo.smartTypedMembers.forEach(function (member) {
                var _a, _b, _c, _d;
                var initializerNode = (_d = (_c = (_b = (_a = type_1.symbol) === null || _a === void 0 ? void 0 : _a.members) === null || _b === void 0 ? void 0 : _b.get(member.name)) === null || _c === void 0 ? void 0 : _c.valueDeclaration) === null || _d === void 0 ? void 0 : _d["initializer"];
                validateCast(initializerNode, member.type);
            });
            castedTo.nestedStructs.forEach(function (struct) {
                var _a, _b, _c, _d;
                var initializerNode = (_d = (_c = (_b = (_a = type_1.symbol) === null || _a === void 0 ? void 0 : _a.members) === null || _b === void 0 ? void 0 : _b.get(struct.name)) === null || _c === void 0 ? void 0 : _c.valueDeclaration) === null || _d === void 0 ? void 0 : _d["initializer"];
                validateStructCast(initializerNode, struct.struct);
            });
        }
    }
    function runValidation(node, smartType, value) {
        var validation = smartType.validator(value);
        if (!validation["isValid"]) {
            errors.push({ message: validation["message"], pos: node.pos, end: node.end });
        }
    }
    function getParentFunction(returnNode) {
        var current = returnNode.parent;
        while (current && current.kind !== ts.SyntaxKind.FunctionDeclaration &&
            current.kind !== ts.SyntaxKind.FunctionExpression &&
            current.kind !== ts.SyntaxKind.ArrowFunction &&
            current.kind !== ts.SyntaxKind.MethodDeclaration) {
            current = current.parent;
        }
        return current;
    }
    function getStructWithSmartTypesOrUndefined(node) {
        var visitedNodes = new Set();
        return getRecursively(node);
        function getRecursively(node) {
            var _a, _b;
            if (!node || visitedNodes.has(node)) {
                return undefined;
            }
            visitedNodes.add(node);
            var members = [];
            var nestedStructs = [];
            (_b = (_a = checker.getTypeAtLocation(node).symbol) === null || _a === void 0 ? void 0 : _a.members) === null || _b === void 0 ? void 0 : _b.forEach(function (value, key) {
                var smartType = getSmartTypeOrUndefined(value.valueDeclaration);
                if (smartType) {
                    members.push({ name: key, type: smartType });
                }
                else {
                    var nestedStruct = getRecursively(value.valueDeclaration);
                    if (nestedStruct) {
                        nestedStructs.push({ name: key, struct: nestedStruct });
                    }
                }
            });
            return members.length === 0 && nestedStructs.length === 0 ? undefined : {
                smartTypedMembers: members,
                nestedStructs: nestedStructs
            };
        }
    }
    function getSmartTypeOrUndefined(node) {
        var _a, _b;
        var typeId = (_b = (_a = checker.getTypeAtLocation(node)) === null || _a === void 0 ? void 0 : _a.aliasSymbol) === null || _b === void 0 ? void 0 : _b["id"];
        return aliases.find(function (a) { return a.symbolId === typeId; });
    }
}
function lintFile(fileName, sourceText) {
    watcher_1.updateFile(fileName, sourceText);
    var program = watcher_1.getProgram();
    var checker = program.getTypeChecker();
    var sourceFile = program.getSourceFile(fileName);
    if (sourceFile) {
        var errors = [];
        var aliases = searchForSmartTypeAliases(sourceFile, errors, checker);
        lint(sourceFile, checker, aliases, errors);
        return errors.map(function (e) {
            var start = sourceFile.getLineAndCharacterOfPosition(skipWhitespaces(e.pos, sourceText));
            var end = sourceFile.getLineAndCharacterOfPosition(skipWhitespaces(e.end, sourceText));
            return {
                message: e.message + " ",
                loc: {
                    start: {
                        line: start.line + 1,
                        column: start.character
                    },
                    end: {
                        line: end.line + 1,
                        column: end.character
                    }
                }
            };
        });
    }
    return [];
}
exports.lintFile = lintFile;
function skipWhitespaces(pos, sourceText) {
    var newPos = pos;
    while (sourceText[newPos].trim() === "") {
        newPos++;
    }
    return newPos;
}
//# sourceMappingURL=linter.js.map
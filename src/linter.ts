import * as ts from 'typescript'
import {__String, SymbolFlags, TypeChecker, TypeFlags} from 'typescript'
import {getProgram, updateFile} from "./watcher";

interface Position {
    line: number
    column: number
}

interface Location {
    start: Position
    end: Position
}

interface Error {
    message: string
    pos: number
    end: number
}

interface EslintError {
    message: string
    loc: Location
}

interface SmartTypeAlias {
    name: string
    symbolId: number
    validator: (arg: any) => any
}

interface StructWithSmartTypes {
    smartTypedMembers: { name: string, type: SmartTypeAlias }[]
    nestedStructs: { name: string, struct: StructWithSmartTypes }[]
}

const SmartTypeName = "SmartType"

function searchForSmartTypeAliases(sourceFile: ts.SourceFile, errors: Error[], checker: TypeChecker): SmartTypeAlias[] {
    const aliases: SmartTypeAlias[] = []

    searchRecursive(sourceFile)

    function searchRecursive(node: ts.Node) {
        if (node.kind === ts.SyntaxKind.TypeAliasDeclaration && node["type"]?.["typeName"]?.["escapedText"] === SmartTypeName) {
            const symbolId = checker.getTypeAtLocation(node)?.aliasSymbol?.["id"]
            const aliasNode = node as ts.TypeAliasDeclaration

            const aliasName = aliasNode.name.escapedText as string
            const type = checker.getTypeAtLocation(aliasNode.type["typeArguments"]?.[0])

            if (type?.symbol?.flags !== SymbolFlags.Function) {
                errors.push({
                    message: "Incorrect validator parameter",
                    pos: aliasNode.type["typeArguments"]?.[0].pos,
                    end: aliasNode.type["typeArguments"]?.[0].end
                })
            } else {
                const validatorNode = type.symbol?.valueDeclaration as ts.FunctionDeclaration
                const text = validatorNode.body?.statements.map(statement => statement.getFullText()).join("\n")
                if (text) {
                    const validator = new Function(validatorNode.parameters[0].name["escapedText"], ts.transpile(text))
                    aliases.push({name: aliasName, symbolId: symbolId, validator: (value) => validator(value)})
                }
            }
        }

        ts.forEachChild(node, searchRecursive)
    }

    return aliases
}

function lint(sourceFile: ts.SourceFile, checker: TypeChecker, aliases: SmartTypeAlias[], errors: Error[]) {
    lintRecursive(sourceFile)

    function lintRecursive(node: ts.Node) {
        if (node.kind === ts.SyntaxKind.ReturnStatement) {
            const parentFunc = getParentFunction(node as ts.ReturnStatement)
            const smartType = getSmartTypeOrUndefined(parentFunc?.["type"])
            if (smartType) {
                validateCast(node["expression"], smartType)
            }else {
                const struct = getStructWithSmartTypesOrUndefined(parentFunc?.["type"])
                if (struct) {
                    validateStructCast(node["expression"], struct)
                }
            }

        } else if (node.kind === ts.SyntaxKind.CallExpression) {
            const expr = (node as ts.CallExpression);
            checker.getTypeAtLocation(node['expression'])
                ?.symbol?.valueDeclaration?.["parameters"]
                ?.map((param: any, i: number) => {
                    return {
                        node: expr.arguments[i],
                        smartType: getSmartTypeOrUndefined(param),
                        structWithSmartType: getStructWithSmartTypesOrUndefined(param)
                    }
                })
                .filter(param => param.node && (param.smartType || param.structWithSmartType))
                .forEach(param => {
                    if (param.smartType) {
                        validateCast(param.node, param.smartType)
                    } else {
                        validateStructCast(param.node, param.structWithSmartType)
                    }
                })

        } else if (node.kind === ts.SyntaxKind.AsExpression) {
            const smartType = getSmartTypeOrUndefined(node)
            if (smartType) {
                validateCast(node["expression"], smartType)
            } else {
                const struct = getStructWithSmartTypesOrUndefined(node)
                if (struct) {
                    validateStructCast(node["expression"], struct)
                }
            }

        } else if (node.kind === ts.SyntaxKind.VariableDeclaration) {
            const smartType = getSmartTypeOrUndefined(node)
            if (smartType && node["initializer"]) {
                validateCast(node["initializer"], smartType)
            } else {
                const struct = getStructWithSmartTypesOrUndefined(node)
                if (struct) {
                    validateStructCast(node["initializer"], struct)
                }
            }

        } else if (node.kind === ts.SyntaxKind.ExpressionStatement && node["expression"]?.operatorToken?.kind === ts.SyntaxKind.EqualsToken) {
            const smartType = getSmartTypeOrUndefined(node["expression"]?.left)
            if (smartType && node["expression"]?.right) {
                validateCast(node["expression"]?.right, smartType)
            } else {
                const struct = getStructWithSmartTypesOrUndefined(node["expression"]?.left)
                if (struct) {
                    validateStructCast(node["expression"]?.right, struct)
                }
            }

        } else if (node.kind === ts.SyntaxKind.NewExpression) {
            const expr = node as ts.NewExpression
            const params = checker.getTypeAtLocation(node["expression"]).getConstructSignatures()?.[0]?.parameters
            if (params) {
                params
                    .map((param: any, i: number) => {
                        return {
                            node: expr.arguments?.[i], smartType: getSmartTypeOrUndefined(param?.valueDeclaration)
                        }
                    })
                    .forEach(param => param.node && param.smartType && validateCast(param.node, param.smartType))
            }

        }

        ts.forEachChild(node, lintRecursive)
    }

    function validateCast(node: ts.Node, smartType: SmartTypeAlias) {
        if (node.kind === ts.SyntaxKind.NumericLiteral || node.kind === ts.SyntaxKind.StringLiteral) {
            runValidation(node, smartType, checker.getTypeAtLocation(node)["value"])
        }

        if (node.kind === ts.SyntaxKind.CallExpression) {
            const declaredReturnType = checker.getTypeAtLocation(node["expression"]).symbol?.valueDeclaration["type"]
            const typeId = checker.getTypeAtLocation(declaredReturnType).aliasSymbol?.["id"]
            if (typeId !== smartType.symbolId) {
                errors.push({
                    message: `${node["expression"]?.["escapedText"]} is not guaranteed to return a valid ${smartType.name}`,
                    pos: node.pos,
                    end: node.end
                })
            }
        }

        if (node.kind === ts.SyntaxKind.AsExpression) {
            const type = checker.getTypeAtLocation(node)
            const typeId = type.aliasSymbol?.["id"]
            if (typeId !== smartType.symbolId) {
                errors.push({
                    message: `Cannot use type ${type["intrinsicName"]} instead of ${smartType.name}`,
                    pos: node["type"].pos,
                    end: node["type"].end
                })
            }
        }

        if (node.kind === ts.SyntaxKind.Identifier) {
            const type = checker.getTypeAtLocation(node)

            if (type.flags === TypeFlags.NumberLiteral || type.flags === TypeFlags.StringLiteral) {
                runValidation(node, smartType, type["value"])

            } else if (type.aliasSymbol?.["id"] !== smartType.symbolId) {
                errors.push({
                    message: `${node["escapedText"]} is not guaranteed to be a valid ${smartType.name}`,
                    pos: node.pos,
                    end: node.end
                })
            }
        }

        if (node.kind === ts.SyntaxKind.BinaryExpression && checker.getTypeAtLocation(node).aliasSymbol?.["id"] !== smartType.symbolId) {
            errors.push({
                message: `Expression is not guaranteed to be a valid ${smartType.name}`,
                pos: node.pos,
                end: node.end
            })
        }
    }

    function validateStructCast(node: ts.Node, castedTo: StructWithSmartTypes) {
        if (node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            const type = checker.getTypeAtLocation(node)
            castedTo.smartTypedMembers.forEach(member => {
                const initializerNode = type.symbol?.members?.get(member.name as __String)?.valueDeclaration?.["initializer"]
                validateCast(initializerNode, member.type)
            })

            castedTo.nestedStructs.forEach(struct => {
                const initializerNode = type.symbol?.members?.get(struct.name as __String)?.valueDeclaration?.["initializer"]
                validateStructCast(initializerNode, struct.struct)
            })
        }
    }

    function runValidation(node: ts.Node, smartType: SmartTypeAlias, value: any) {
        const validation = smartType.validator(value)
        if (!validation["isValid"]) {
            errors.push({message: validation["message"], pos: node.pos, end: node.end})
        }
    }

    function getParentFunction(returnNode: ts.ReturnStatement): ts.Node {
        let current = returnNode.parent

        while (current && current.kind !== ts.SyntaxKind.FunctionDeclaration &&
        current.kind !== ts.SyntaxKind.FunctionExpression &&
        current.kind !== ts.SyntaxKind.ArrowFunction &&
        current.kind !== ts.SyntaxKind.MethodDeclaration) {
            current = current.parent
        }

        return current
    }

    function getStructWithSmartTypesOrUndefined(node: ts.Node): StructWithSmartTypes | undefined {

        const visitedNodes = new Set()

        return getRecursively(node)

        function getRecursively(node: ts.Node): StructWithSmartTypes | undefined {
            if (!node || visitedNodes.has(node)) {
                return undefined
            }

            visitedNodes.add(node)

            const members: { name: string, type: SmartTypeAlias }[] = []
            const nestedStructs: { name: string, struct: StructWithSmartTypes }[] = []

            checker.getTypeAtLocation(node).symbol?.members?.forEach((value, key) => {
                const smartType = getSmartTypeOrUndefined(value.valueDeclaration)
                if (smartType) {
                    members.push({name: key as string, type: smartType})
                } else {
                    const nestedStruct = getRecursively(value.valueDeclaration)
                    if (nestedStruct) {
                        nestedStructs.push({name: key as string, struct: nestedStruct})
                    }
                }
            })

            return members.length === 0 && nestedStructs.length === 0 ? undefined : {
                smartTypedMembers: members,
                nestedStructs: nestedStructs
            }
        }
    }

    function getSmartTypeOrUndefined(node: ts.Node): SmartTypeAlias | undefined {
        const typeId = checker.getTypeAtLocation(node)?.aliasSymbol?.["id"]
        return aliases.find(a => a.symbolId === typeId)
    }
}

export function lintFile(fileName: string, sourceText: string): EslintError[] {
    updateFile(fileName, sourceText)

    const program = getProgram()
    const checker = program.getTypeChecker()

    const sourceFile = program.getSourceFile(fileName)
    if (sourceFile) {
        const errors: Error[] = []

        const aliases = searchForSmartTypeAliases(sourceFile, errors, checker as TypeChecker)
        lint(sourceFile, checker as TypeChecker, aliases, errors)

        return errors.map(e => {
            const start = sourceFile.getLineAndCharacterOfPosition(skipWhitespaces(e.pos, sourceText))
            const end = sourceFile.getLineAndCharacterOfPosition(skipWhitespaces(e.end, sourceText))

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
            }
        })
    }

    return []
}

function skipWhitespaces(pos: number, sourceText: string): number {
    let newPos = pos
    while (sourceText[newPos].trim() === "") {
        newPos++
    }

    return newPos
}

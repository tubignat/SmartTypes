import * as ts from 'typescript'
import {SymbolFlags, TypeChecker, TypeFlags} from 'typescript'
import {getProgram, updateFile} from "./watcher";

interface Error {
    message: string
    pos: number
    end: number
}

interface SmartTypeAlias {
    name: string
    symbolId: number
    validator: (arg: any) => any
}

const SmartTypeName = "SmartType"

function searchForSmartTypeAliases(sourceFile: ts.SourceFile, errors: Error[], checker: TypeChecker): SmartTypeAlias[] {
    const aliases: SmartTypeAlias[] = []

    searchRecursive(sourceFile)

    function searchRecursive(node: ts.Node) {
        if (node.kind === ts.SyntaxKind.TypeAliasDeclaration && node["type"]?.["typeName"]?.["escapedText"] === SmartTypeName) {
            const symbolId = checker.getTypeAtLocation(node).aliasSymbol?.["id"]
            const aliasNode = node as ts.TypeAliasDeclaration

            const aliasName = aliasNode.name.escapedText as string
            const type = checker.getTypeAtLocation(aliasNode.type["typeArguments"]?.[0])

            if (type.symbol.flags !== SymbolFlags.Function) {
                errors.push({
                    message: "Incorrect validator parameter",
                    pos: aliasNode.type["typeArguments"]?.[0].pos,
                    end: aliasNode.type["typeArguments"]?.[0].end
                })
            } else {
                const validatorNode = type.symbol.valueDeclaration as ts.FunctionDeclaration
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
        switch (node.kind) {
        case ts.SyntaxKind.CallExpression:
            const expr = (node as ts.CallExpression);
            checker.getTypeAtLocation(node['expression'])
                .symbol?.valueDeclaration?.["parameters"]
                ?.map((param: any, i: number) => {
                    return {
                        node: expr.arguments[i],
                        smartType: aliases.find(a => a.name === param["type"]?.["typeName"]?.["escapedText"])
                    }
                })
                .filter(param => param.node && param.smartType)
                .forEach(param => validateCast(param.node, param.smartType))

            break

        case ts.SyntaxKind.AsExpression:
            const typeId = checker.getTypeAtLocation(node).aliasSymbol?.["id"]
            const smartType = aliases.find(a => a.symbolId === typeId)
            if (smartType) {
                validateCast(node["expression"], smartType)
            }

            break
        }

        ts.forEachChild(node, lintRecursive)
    }

    function validateCast(node: ts.Node, smartType: SmartTypeAlias) {
        if (node.kind === ts.SyntaxKind.NumericLiteral || node.kind === ts.SyntaxKind.StringLiteral) {
            runValidation(node, smartType, checker.getTypeAtLocation(node)["value"])
        }

        if (node.kind === ts.SyntaxKind.CallExpression) {
            const typeId = checker.getTypeAtLocation(node).aliasSymbol?.["id"]
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
    }

    function runValidation(node: ts.Node, smartType: SmartTypeAlias, value: any) {
        const validation = smartType.validator(value)
        if (!validation["isValid"]) {
            errors.push({message: validation["message"], pos: node.pos, end: node.end})
        }
    }
}

export function lintFile(fileName: string, sourceText: string): Error[] {
    updateFile(fileName, sourceText)

    const program = getProgram()
    const checker = program.getTypeChecker()

    const errors: Error[] = []

    const sourceFile = program.getSourceFile(fileName)
    if (sourceFile) {
        const aliases = searchForSmartTypeAliases(sourceFile, errors, checker as TypeChecker)
        lint(sourceFile, checker as TypeChecker, aliases, errors)
    }

    return errors
}

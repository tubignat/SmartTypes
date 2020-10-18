import {lintFile} from "./linter";

interface ErrorEsLintFormat {
    message: string
    loc: {
        start: { line: number, column: number }
        end: { line: number, column: number }
    }
}

function run(context) {
    const filename = context.getFilename()
    const sourceText = context.getSourceCode().getText()
    const errors = lintFile(filename, sourceText)

    const lines = sourceText.split('\n')

    errors.forEach(e => {
        let currentLine = 0
        let currentPos = 0
        let endOfLine = lines[0].length

        while (!(e.pos >= currentPos && e.end <= endOfLine)) {
            currentLine++
            currentPos = endOfLine + 1
            endOfLine = currentPos + lines[currentLine].length
        }

        const start = e.pos - currentPos + 1
        const end = e.end - currentPos
        const esLintError: ErrorEsLintFormat = {
            message: e.message + " ",
            loc: {
                start: {line: currentLine + 1, column: start === end ? start - 1 : start},
                end: {line: currentLine + 1, column: end},
            }
        }

        context.report(esLintError)
    })
}

module.exports = {
    rules: {
        'smart-types': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'SmartTypes check',
                    category: 'SmartTypes',
                    recommended: false,
                },
            },
            create: (context) => {
                return {
                    Program: () => run(context)
                }
            }
        }
    }
}

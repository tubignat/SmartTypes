import {lintFile} from "./linter";

function run(context) {
    const filename = context.getFilename()
    const sourceText = context.getSourceCode().getText()
    lintFile(filename, sourceText).forEach(error => context.report(error))
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

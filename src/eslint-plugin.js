"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var linter_1 = require("./linter");
function run(context) {
    var filename = context.getFilename();
    var sourceText = context.getSourceCode().getText();
    var errors = linter_1.lintFile(filename, sourceText);
    var lines = sourceText.split('\n');
    errors.forEach(function (e) {
        var currentLine = 0;
        var currentPos = 0;
        var endOfLine = lines[0].length;
        while (!(e.pos >= currentPos && e.end <= endOfLine)) {
            currentLine++;
            currentPos = endOfLine + 1;
            endOfLine = currentPos + lines[currentLine].length;
        }
        var start = e.pos - currentPos + 1;
        var end = e.end - currentPos;
        var esLintError = {
            message: e.message + " ",
            loc: {
                start: { line: currentLine + 1, column: start === end ? start - 1 : start },
                end: { line: currentLine + 1, column: end },
            }
        };
        context.report(esLintError);
    });
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
            create: function (context) {
                return {
                    Program: function () { return run(context); }
                };
            }
        }
    }
};
//# sourceMappingURL=eslint-plugin.js.map
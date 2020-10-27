"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var linter_1 = require("./linter");
function run(context) {
    var filename = context.getFilename();
    var sourceText = context.getSourceCode().getText();
    linter_1.lintFile(filename, sourceText).forEach(function (error) { return context.report(error); });
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
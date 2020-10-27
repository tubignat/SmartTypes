"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var linter_1 = require("./linter");
var path = require("path");
var sourceText = fs_1.readFileSync("./src/test.ts").toString();
var errors = linter_1.lintFile(path.resolve("src/test.ts"), sourceText);
console.log(errors);
//# sourceMappingURL=index.js.map
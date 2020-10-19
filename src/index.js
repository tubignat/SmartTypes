"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var linter_1 = require("./linter");
var fs_1 = require("fs");
var path = require("path");
var sourceText = fs_1.readFileSync("./src/test.ts").toString();
linter_1.lintFile(path.resolve("src/test.ts"), sourceText);
//# sourceMappingURL=index.js.map
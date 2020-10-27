import {readFileSync} from "fs";
import {lintFile} from "./linter";
import * as path from "path";

const sourceText = readFileSync("./src/test.ts").toString()


const errors = lintFile(path.resolve("src/test.ts"), sourceText)
console.log(errors)

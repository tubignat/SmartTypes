import {lintFile} from "./linter";
import {readFileSync} from "fs";

const sourceText = readFileSync("./src/test.ts").toString()
lintFile("src/test.ts", sourceText)

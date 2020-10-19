import {lintFile} from "./linter";
import {readFileSync} from "fs";
import * as path from "path";

const sourceText = readFileSync("./src/test.ts").toString()


lintFile(path.resolve("src/test.ts"), sourceText)

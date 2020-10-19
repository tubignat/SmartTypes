import * as ts from 'typescript'
import {BuilderProgram, CompilerOptions, FileWatcherCallback, FileWatcherEventKind, Program, WatchOfConfigFile} from 'typescript'

const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: path => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine
};

let watchProgram: WatchOfConfigFile<BuilderProgram> | null = null
const inMemoryUpdatedSources: { [key: string]: string } = {}
const callbacks: { [key: string]: FileWatcherCallback } = {}

export function getProgram(): Program {
    if (!watchProgram) {
        watchProgram = watchMain()
    }

    return watchProgram.getProgram().getProgram()
}

export function updateFile(filename: string, sourceText: string) {
    if (!watchProgram) {
        watchProgram = watchMain()
    }

    if (!callbacks[filename]) {
        throw new Error(`Watcher callback for ${filename} was not set`)
    }

    inMemoryUpdatedSources[filename] = sourceText
    callbacks[filename](filename, FileWatcherEventKind.Changed)
}

function watchMain(): WatchOfConfigFile<BuilderProgram> {
    const config = ts.findConfigFile("./", ts.sys.fileExists, "tsconfig.json");
    if (!config) {
        throw new Error("Could not find a valid 'tsconfig.json'.");
    }

    const createProgram = ts.createSemanticDiagnosticsBuilderProgram;
    const host = ts.createWatchCompilerHost(config, {}, ts.sys, createProgram, reportDiagnostic, reportWatchStatusChanged);

    const origCreateProgram = host.createProgram;
    host.createProgram = (rootNames: ReadonlyArray<string>, options, host, oldProgram) => {
        console.log("** We're about to create the program! **");
        return origCreateProgram(rootNames, options, host, oldProgram);
    };
    const origPostProgramCreate = host.afterProgramCreate;

    host.afterProgramCreate = program => {
        console.log("** We finished making the program! **");
        origPostProgramCreate!(program);
    };

    const origWatchFile = host.watchFile
    host.watchFile = (path: string, callback: FileWatcherCallback, pollingInterval?: number, options?: CompilerOptions) => {
        callbacks[path] = callback
        return origWatchFile(path, callback, pollingInterval, options)
    }

    const origReadFile = host.readFile
    host.readFile = (path: string, encoding?: string) => {
        if (inMemoryUpdatedSources[path]) {
            console.log(`** Reading file ${path} from in memory updated sources **`);
            const result = inMemoryUpdatedSources[path]
            delete inMemoryUpdatedSources[path]

            return result
        }

        console.log(`** Reading file ${path} from file system`);
        return origReadFile(path, encoding)
    }

    return ts.createWatchProgram(host)
}

function reportDiagnostic(diagnostic: ts.Diagnostic) {
    console.error("Error", diagnostic.code, ":", ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()));
}

function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
    console.info(ts.formatDiagnostic(diagnostic, formatHost));
}


#!/usr/bin/env node

import assert from "assert";
import { processSnippets } from "./index";
import { parseOptions } from "./option-parser";

const options = parseOptions(process.argv.slice(2));

if (options.help) {
    console.log(
        `snippet-collector is a utility to collect code-snippets from your source and test files so they can later be reused in docs`,
    );
    console.log(`Example usage: snippet-collector --files ./src/**/*.ts --output ./generated/snippets.json`);
}

assert(options.files, "You must specify files to be processed: eg. --files ./src/**/*.ts");

processSnippets({
    globPatterns: options.files,
    outputFile: options.output,
});

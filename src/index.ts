import fs from "fs-extra";
import glob from "glob";
import path from "path";
import util from "util";

const globP = util.promisify(glob);

interface Snippet {
    name: string;
    content: string;
}

interface SnippetOccurance extends Snippet {
    startLineNo: number;
    endLineNo: number;
    occuranceIndex: number;
}

type InterimSnippetOccurance = Pick<SnippetOccurance, Exclude<keyof SnippetOccurance, "endLineNo">> &
    Partial<Pick<SnippetOccurance, "endLineNo">>;

export const collectSnippetsFromFiles = async (
    filePaths: string[],
    snippets = new Map<string, SnippetOccurance[]>(),
) => {
    await Promise.all(filePaths.map(filePath => collectSnippetsFromFile(filePath, snippets)));
    await consolidateSnippets(snippets);
    return snippets;
};

export const collectSnippetsFromFile = async (filePath: string, snippets: Map<string, SnippetOccurance[]>) => {
    const contents = await fs.readFile(filePath, { encoding: "utf-8" });
    return collectSnippetsFromSource(contents, filePath, snippets);
};

export const endMatchingSnippets = (
    names: string[],
    lineNo: number,
    activeSnippets: InterimSnippetOccurance[],
    snippets: Map<string, SnippetOccurance[]>,
) => {
    let snippetsToEnd: InterimSnippetOccurance[] = [];
    let nextActiveSnippets: InterimSnippetOccurance[] = [];
    if (names.length > 0) {
        activeSnippets.forEach(s => {
            if (names.indexOf(s.name) >= 0) {
                snippetsToEnd.push(s);
            } else {
                nextActiveSnippets.push(s);
            }
        });
    } else {
        snippetsToEnd = activeSnippets;
    }
    snippetsToEnd.forEach(snippet => {
        const snippetOccurances = snippets.get(snippet.name) || [];
        if (snippetOccurances[snippet.occuranceIndex]) {
            throw new Error(
                `Found multiple snippets with same name: ${snippet.name} and occurance index: ${
                    snippet.occuranceIndex
                }`,
            );
        }
        snippet.endLineNo = lineNo;
        snippetOccurances[snippet.occuranceIndex] = snippet as SnippetOccurance;
        snippets.set(snippet.name, snippetOccurances);
    });
    return nextActiveSnippets;
};

export const collectSnippetsFromSource = (
    sourceContent: string,
    sourceFilePath: string,
    snippets: Map<string, SnippetOccurance[]>,
) => {
    let activeSnippets: InterimSnippetOccurance[] = [];
    sourceContent.split("\n").forEach((line, index) => {
        const trimmedLine = line.trim();
        const lineNo = index + 1;
        let match = trimmedLine.match(/^(\/\/|#|\/?\*+)\s*@snippet:(start|end)\s*(.*)$/);
        if (match) {
            let rawArgs = match[3].trim();
            const directive = match[2];
            switch (directive) {
                case "start":
                    if (!rawArgs) return;
                    if (match[1].match(/^\/\*/)) rawArgs = rawArgs.replace(/\s*\*+$/, "");
                    activeSnippets.push(...extractInitialSnippetConfigs(rawArgs, lineNo));
                    return;
                case "end":
                    let names: string[] = [];
                    if (rawArgs) {
                        names = rawArgs.split(",").map(s => s.trim());
                    }
                    activeSnippets = endMatchingSnippets(names, lineNo, activeSnippets, snippets);
                    return;
            }
        }
        activeSnippets.forEach(snippet => {
            snippet.content += line + "\n";
        });
    });
    if (activeSnippets.length !== 0) {
        throw new Error(
            `Unterminated snippets in file ${sourceFilePath}: ` +
                `Snippet(s) starting at line ${activeSnippets.map(s => s.startLineNo).join(" ,")} were not terminated`,
        );
    }
};

const extractInitialSnippetConfigs = (rawArgs: string, startLineNo: number): InterimSnippetOccurance[] =>
    rawArgs
        .split(",")
        .map(s => s.trim().split(":"))
        .map(([name, occuranceIndex = 0]) => ({
            name,
            startLineNo,
            endLineNo: undefined,
            occuranceIndex: Number(occuranceIndex),
            content: "",
        }));

export const consolidateSnippets = (snippets: Map<string, SnippetOccurance[]>): {[name: string]: Snippet} => {
    const consolidated: Snippet[] = [];
    for (const [, snippetOccurances] of snippets.entries()) {
        if (snippetOccurances.length === 0) continue;
        const sampleOccurance = snippetOccurances.find(Boolean);
        if (!sampleOccurance) continue;
        const { occuranceIndex, startLineNo, endLineNo, ...snippet } = sampleOccurance;
        snippet.content = "";
        for (let i = 0; i < snippetOccurances.length; i++) {
            let occurance = snippetOccurances[i];
            if (!occurance) throw new Error(`Missing occurance for snippet: ${sampleOccurance.name}:${i}`);
            snippet.content += occurance.content;
        }
        consolidated.push(snippet);
    }
    return consolidated.reduce((result, snippet) => {
        result[snippet.name] = snippet;
        return result;
    }, {} as {[name: string]: Snippet});
};

export const unquote = (str: string) => {
    if (str.charAt(0) !== str.charAt(str.length-1)) return str;
    if (str.charAt(0) === '"' || str.charAt(0) === "'") return str.slice(1, -1);
    return str;
};

export const collectSnippets = async (options: { globPatterns: string | string[] }) => {
    const snippets = new Map();
    for (const globPattern of ([] as string[]).concat(options.globPatterns)) {
        const filePaths = await globP(unquote(globPattern));
        for (const filePath of filePaths) {
            await collectSnippetsFromFile(filePath, snippets);
        }
    }
    return consolidateSnippets(snippets);
};

export const processSnippets = async (options: { globPatterns: string | string[]; outputFile?: string }) => {
    const consolidated = await collectSnippets(options);
    if (options.outputFile) {
        fs.writeFileSync(path.resolve(options.outputFile), JSON.stringify(consolidated, null, 4));
    } else {
        console.log(util.inspect(consolidated, { depth: null }));
    }
}

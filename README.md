# About

snippet-collector is a simple utility that lets you extract out example snippets from your source and test files, so that they can be reused in your docs. That way your docs never go out of sync with the source and you can ensure that your examples are covered by your test suite.

# Installation

Ensure node and npm are [installed](https://nodejs.org/en/download/). Only latest stable version is supported at this point.

## As local dependency

```bash
npm install --save-dev snippet-collector
```

Add a script entry in package.json: 

```json
{
    "scripts": {
        "snippets:collect": "snippet-collector --files ./src/**/*.js --output ./generated/snippets.json"
    }
}
```

## As global dependency (Not recommended)

```bash
npm install -g snippet-collector
```

A sudo may be required, depending on how node installation is configured. 

# Usage

## Annotating the source/test files with snippet directives

Snippets can be marked by `@snippet:start` and `@snippet:end` directives.

```js
// @snippet:start usage
const foo = Foo();
foo.bar();
// @snippet:end
```

It is possible to have composite snippets spread across multiple-files - They will be concatenated in the specified order (which is mandatory if there are multiple snippets of the same name).

```js
// @snippet:start usage:0
import Foo from "foo-lib"
// @snippet:end 

// @snippet:start usage:1
const foo = Foo();
foo.bar();
// @snippet:end
```

The order indices must start from 0 and must be contiguous. Otherwise, an error will be thrown.

## As CLI:

```bash
snippet-collector --files ./src/**/*.js --output ./generated/snippets.json
```

Your documentation generator can use the extracted json. The structure of json looks like this: 

```json
{
    "usage": {
        "name": "usage",
        "content": "import Foo from \"foo-lib\";\rconst foo = Foo();\rfoo.bar();\r"
    }
}
```
Entries are keyed by snippet name and have a content property containing the combined snippet text. 

## As Node library

It is also possible to use snippet-collector as a node library: 

```js
const {processSnippets} = require('snippet-collector');

processSnippets({
    globPatterns: './src/**/*.js',
    outputFile: './generated/snippets.json'
});
```

Or alternatively, you can skip the generation and just get the extracted collection of snippets: 

```js
const {collectSnippets} = require('snippet-collector');

collectSnippets({
    globPatterns: './src/**/*.js'
}).then((snippets) => {
    console.log('snippets =>', snippets);
});
```

This returns a promise that resolves to a javascript object of same structure as above.

# Contributing

Suggestions, bug reports as well as PRs are welcome. However, it is advisable that any suggestion that significantly alters the scope of the project be discussed first.

# License 

MIT
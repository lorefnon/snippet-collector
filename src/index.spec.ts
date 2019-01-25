import { collectSnippetsFromSource, collectSnippetsFromFile, consolidateSnippets } from './index';

test('collectSnippetsFromFile', async () => {
    const snippets = new Map();
    await collectSnippetsFromFile('src/__fixtures__/test.js', snippets);
    expect(snippets).toMatchSnapshot();
    const consolidated = consolidateSnippets(snippets);
    expect(consolidated).toMatchSnapshot();
})
import type { languages as Languages } from 'monaco-editor/esm/vs/editor/editor.api.js';
import snippets from './snippets.json';

interface Range {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
}

function createDependencyProposals(range: Range, languages: typeof Languages) {
  return Object.values(snippets).map((snippet) => ({
    label: snippet.prefix,
    kind: languages.CompletionItemKind.Function,
    documentation: snippet.description,
    insertText: snippet.body,
    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range,
  }));
}

export function addTwigAutocompletion(languages: typeof Languages) {
  languages.registerCompletionItemProvider('twig', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range: Range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      return {
        suggestions: createDependencyProposals(range, languages),
      };
    },
  });
}

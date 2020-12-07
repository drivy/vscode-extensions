import * as vscode from "vscode";
import {
  HTML_JAVASCRIPT_FILE_SELECTORS,
  HAML_FILE_SELECTORS,
} from "../file-selectors";
import {
  getCompletionsFromClassAttributeMatch,
  getCompletionsFromPartialClassName,
} from "./completion";

export function findAll(re: RegExp, str: string): RegExpMatchArray[] {
  let match: RegExpMatchArray | null;
  let matches: RegExpMatchArray[] = [];
  while ((match = re.exec(str)) !== null) {
    matches.push({ ...match });
  }
  return matches;
}

export function findLast(re: RegExp, str: string): RegExpMatchArray | null {
  const matches = findAll(re, str);
  if (matches.length === 0) {
    return null;
  }
  return matches[matches.length - 1];
}

export const buildHtmlJavascriptProvider = (
  cssRules: any[],
  classPrefix: string | undefined
) =>
  vscode.languages.registerCompletionItemProvider(
    HTML_JAVASCRIPT_FILE_SELECTORS,
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const linePrefix = document
          .lineAt(position)
          .text.substr(0, position.character);

        // console.log('linePrefix', linePrefix);

        const classAttributeMatch = findLast(
          /(?:\b|:)class(?:Name)?=['"`{]/gi,
          linePrefix
        );

        if (classAttributeMatch != null) {
          return getCompletionsFromClassAttributeMatch(
            classAttributeMatch,
            linePrefix,
            position,
            cssRules,
            classPrefix
          );
        }
      },
    },
    "-"
  );

export const buildHamlProvider = (
  cssRules: any[],
  classPrefix: string | undefined
) =>
  vscode.languages.registerCompletionItemProvider(
    HAML_FILE_SELECTORS,
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const linePrefix = document
          .lineAt(position)
          .text.substr(0, position.character);

        const trimedLinePrefix = linePrefix.trim();
        const isHtmlTagContext =
          trimedLinePrefix.startsWith(".") || trimedLinePrefix.startsWith("%");

        let dotPartialClassNameMatch = null;
        if (isHtmlTagContext) {
          dotPartialClassNameMatch = findLast(/\.([^\.]+)/gi, linePrefix);
          if (dotPartialClassNameMatch != null) {
            const partialClassName = dotPartialClassNameMatch[1];

            let replacementRange: any = {
              start: {
                line: position.line,
                character: position.character - partialClassName.length,
              },
              end: position,
            };

            return getCompletionsFromPartialClassName(
              partialClassName,
              replacementRange,
              cssRules,
              classPrefix
            );
          }
        }

        if (!dotPartialClassNameMatch) {
          const classAttributeMatch = findLast(
            /(?:\b|:)class(?:Name)?:[ ]?['"`{]/gi,
            linePrefix
          );

          if (classAttributeMatch != null) {
            // console.log('classAttributeMatch[0]', classAttributeMatch[0]);

            return getCompletionsFromClassAttributeMatch(
              classAttributeMatch,
              linePrefix,
              position,
              cssRules,
              classPrefix
            );
          }
        }
      },
    },
    "-"
  );

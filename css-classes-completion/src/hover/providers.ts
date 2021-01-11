import * as vscode from "vscode";
import {
  HAML_FILE_SELECTORS,
  HTML_JAVASCRIPT_FILE_SELECTORS,
} from "../file-selectors";

export const buildHoverProvider = (cssRules: any[]) =>
  vscode.languages.registerHoverProvider(
    [...HTML_JAVASCRIPT_FILE_SELECTORS, ...HAML_FILE_SELECTORS],
    {
      provideHover(document, position, token) {
        const range = document.getWordRangeAtPosition(
          position,
          /[\w-]+[/]?[\w-]+/
        );
        const word = document.getText(range);

        if (word) {
          const classNameToFind = `.${word}`;
          const cssObj = cssRules.find(
            (classObj) =>
              classObj.selectors && classObj.selectors[0] === classNameToFind
          );

          if (cssObj) {
            return new vscode.Hover({
              language: "css",
              value: cssObj.stringified,
            });
          }
        }
      },
    }
  );

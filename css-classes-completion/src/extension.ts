/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from "vscode";
import * as path from "path";
import {
  getClassAttributeLexer,
  getComputedClassAttributeLexer,
} from "./util/lexers";
import { MarkupKind } from "vscode-languageserver";
import { getColorFromValue } from "./util/color";
import { CompletionItemKind } from "vscode";

import * as css from "css";

const HTML_JAVASCRIPT_FILE_SELECTORS = [
  { language: "javascript", scheme: "file" },
  { language: "javascript", scheme: "untitled" },
  { language: "javascriptreact", scheme: "file" },
  { language: "javascriptreact", scheme: "untitled" },
  { language: "typescript", scheme: "file" },
  { language: "typescript", scheme: "untitled" },
  { language: "typescriptreact", scheme: "file" },
  { language: "typescriptreact", scheme: "untitled" },
];

const HAML_FILE_SELECTORS = [
  { language: "haml", scheme: "file" },
  { language: "haml", scheme: "untitled" },
];

const tailwindSizeSortWeights = [
  ["2xs", 1],
  ["xs", 2],
  ["sm", 3],
  ["md", 4],
  ["lg", 5],
  ["2xl", 7],
  ["xl", 6],
];

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

function completionsFromClassList(
  classList: string,
  classListRange: any,
  filter?: (item: any) => boolean
): any {
  let classNames = classList.split(/[\s+]/);
  const partialClassName = classNames[classNames.length - 1];

  // console.log('classNames', classNames);
  // console.log('partialClassName', partialClassName);
  let sep = "-"; //state.separator
  let parts = partialClassName.split(sep);
  let subset: any;
  let subsetKey: string[] = [];
  let isSubset: boolean = false;
  let replacementRange = {
    ...classListRange,
    start: {
      ...classListRange.start,
      character: classListRange.end.character - partialClassName.length,
    },
  };

  // console.log('replacementRange', replacementRange);

  return { partialClassName, replacementRange };
}

function computeItemCompletionSortText(
  label: string,
  classPrefix: string | undefined
) {
  let sortText =
    classPrefix && label.startsWith(`.${classPrefix}-`)
      ? `${label.replace(`.${classPrefix}-`, `.${classPrefix}`)}-`
      : label; // -- variation are put at the end

  // sort regarding tailwind variation sizes
  for (let i = 0; i < tailwindSizeSortWeights.length; i++) {
    const sizeToFind = `-${tailwindSizeSortWeights[i][0]}`;
    if (label.endsWith(sizeToFind)) {
      sortText = `${sortText.replace(
        sizeToFind,
        `-${tailwindSizeSortWeights[i][1]}`
      )}`;
      break;
    }
  }

  return sortText;
}

function getCompletionsFromPartialClassName(
  partialClassName: string,
  replacementRange: any,
  cssRules: any[],
  classPrefix: string | undefined,
  shouldInsertExtraWhiteSpace: boolean = false
) {
  // console.log('partialClassName', partialClassName);

  let matchingClasses = [];

  if (classPrefix) {
    const isCobaltClass = partialClassName.startsWith(classPrefix);

    matchingClasses = cssRules.reduce((acc, classObj, i) => {
      if (
        isCobaltClass &&
        classObj.selectors &&
        classObj.selectors[0].startsWith("." + partialClassName)
      ) {
        acc.push({
          type: "className",
          label: classObj.selectors[0],
          property: classObj.declarations[0].property,
          propertyValue: classObj.declarations[0].value,
          cssObj: classObj,
        });
      } else if (
        classObj.declarations &&
        classObj.declarations[0].property &&
        classObj.declarations[0].property.startsWith(partialClassName)
      ) {
        acc.push({
          type: "property",
          label: classObj.selectors[0],
          property: classObj.declarations[0].property,
          propertyValue: classObj.declarations[0].value,
          cssObj: classObj,
        });
      }
      return acc;
    }, []);
  } else {
    matchingClasses = cssRules.reduce((acc, classObj, i) => {
      if (
        classObj.selectors &&
        classObj.selectors[0].startsWith("." + partialClassName)
      ) {
        acc.push({
          type: "className",
          label: classObj.selectors[0],
          property: classObj.declarations[0].property,
          propertyValue: classObj.declarations[0].value,
          cssObj: classObj,
        });
      } else if (
        classObj.declarations &&
        classObj.declarations[0].property &&
        classObj.declarations[0].property.startsWith(partialClassName)
      ) {
        acc.push({
          type: "property",
          label: classObj.selectors[0],
          property: classObj.declarations[0].property,
          propertyValue: classObj.declarations[0].value,
          cssObj: classObj,
        });
      }
      return acc;
    }, []);
  }

  // console.log('cobalt matching classes', matchingClasses);

  const completions = matchingClasses.map((match: any) => {
    let kind: CompletionItemKind = CompletionItemKind.Constant;
    let documentation: any = undefined;

    const color = getColorFromValue(match.propertyValue);
    if (color !== null) {
      kind = CompletionItemKind.Color;

      // documentation = color;
      documentation = match.propertyValue;
    }

    let extraDetails: string = "";

    var m = match.propertyValue.match(/([-]?\d*\.?\d+)rem/);
    if (m) {
      const value = parseFloat(m[1].startsWith(".") ? `0${m[1]}` : m[1]);
      extraDetails = `=> ${16 * value}px`;
    }

    if (!documentation) {
      documentation = {
        kind: MarkupKind.Markdown,
        value: ["```css", match.cssObj.stringified, "```"].join("\n"),
      };
    }

    const item = new vscode.CompletionItem(match.label, kind);

    if (color || extraDetails) {
      item.detail = `${match.property}: ${match.propertyValue}; ${extraDetails}`;
    }

    item.documentation = documentation;
    item.insertText = shouldInsertExtraWhiteSpace
      ? match.label.replace(".", "") + " "
      : match.label.replace(".", "");
    item.range = replacementRange;
    item.filterText = match.type === "className" ? match.label : match.property;
    item.sortText = computeItemCompletionSortText(match.label, classPrefix);

    return item;
  });

  // console.log('completions', completions);

  return completions;
}

function getCompletionsFromClassAttributeMatch(
  classAttributeMatch: RegExpMatchArray,
  linePrefix: string,
  position: vscode.Position,
  cssRules: any[],
  classPrefix: string | undefined
) {
  //console.log('classAttributeMatch[0]', classAttributeMatch[0]);

  const lexer =
    classAttributeMatch[0][0] === ":"
      ? getComputedClassAttributeLexer()
      : getClassAttributeLexer();

  lexer.reset(
    linePrefix.substr(
      (classAttributeMatch.index as number) + classAttributeMatch[0].length - 1
    )
  );

  let tokens = Array.from(lexer);
  let last = tokens[tokens.length - 1];

  //console.log('last', last);

  if (
    (last.type && last.type.startsWith("start")) ||
    last.type === "classlist"
  ) {
    let classList = "";
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].type === "classlist") {
        classList = tokens[i].value + classList;
      } else {
        break;
      }
    }

    const range = {
      start: {
        line: position.line,
        character: position.character - classList.length,
      },
      end: position,
    };

    let { partialClassName, replacementRange } = completionsFromClassList(
      classList,
      range
    );

    return getCompletionsFromPartialClassName(
      partialClassName,
      replacementRange,
      cssRules,
      classPrefix,
      !!vscode.workspace
        .getConfiguration()
        .get("cssClassesCompletion.extraWhiteSpace")
    );
  }

  return null;
}

export function activate(context: vscode.ExtensionContext) {
  const utilitiesFileRawPath:
    | string
    | undefined = vscode.workspace
    .getConfiguration()
    .get("cssClassesCompletion.utilitiesFilePath");

  const classPrefix:
    | string
    | undefined = vscode.workspace
    .getConfiguration()
    .get("cssClassesCompletion.classPrefix");

  if (!vscode.workspace.rootPath) {
    return console.log("You must have a workspace opened.");
  }

  if (!utilitiesFileRawPath) {
    return console.log("You must defined the utility classes file path.");
  }

  let cssRules: any[];

  const utilitiesFilePathes = utilitiesFileRawPath
    .split(",")
    .map((path) => path.trim());

  for (let i = 0; i < utilitiesFilePathes.length; i++) {
    // console.log('try to open', utilitiesFilePathes[i]);
    var filePath = path.join(
      "" + vscode.workspace.rootPath,
      utilitiesFilePathes[i]
    );
    var openPath = vscode.Uri.file(filePath);
    vscode.workspace.openTextDocument(openPath).then((doc) => {
      if (!cssRules) {
        const parsedCss = css.parse(doc.getText());

        if (parsedCss != null) {
          cssRules = (parsedCss as any).stylesheet.rules.map((rule: any) => {
            return {
              ...rule,
              stringified: css.stringify({
                type: "stylesheet",
                stylesheet: { rules: [rule] },
              }),
            };
          });
        }
      }
    });
  }

  const htmlJavascriptProvider = vscode.languages.registerCompletionItemProvider(
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

  const hamlProvider = vscode.languages.registerCompletionItemProvider(
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

        if (isHtmlTagContext) {
          const partialClassNameMatch = findLast(/\.([^\.]+)/gi, linePrefix);
          if (partialClassNameMatch != null) {
            const partialClassName = partialClassNameMatch[1];

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
        } else {
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

  context.subscriptions.push(htmlJavascriptProvider, hamlProvider);
}

import * as vscode from "vscode";
import { getColorFromValue } from "../util/color";
import { CompletionItemKind } from "vscode";
import { extractRemUnit, replaceRemToPx } from "../util/css-units";

const tailwindSizeSortWeights = [
  ["2xs", 1],
  ["xs", 2],
  ["sm", 3],
  ["md", 4],
  ["lg", 5],
  ["2xl", 7],
  ["xl", 6],
];

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

export function getCompletionsFromPartialClassName(
  partialClassName: string,
  replacementRange: any,
  cssRules: any[],
  classPrefix?: string,
  rootFontSizeInPx?: number,
  shouldInsertExtraWhiteSpace: boolean = false
) {
  let matchingClasses = [];

  if (classPrefix) {
    const isUtilityClass = partialClassName.startsWith(classPrefix);

    matchingClasses = cssRules.reduce((acc, classObj, i) => {
      if (
        isUtilityClass &&
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

  const completions = matchingClasses.map((match: any) => {
    let kind: CompletionItemKind = CompletionItemKind.Constant;
    let documentation: any = undefined;

    const color = getColorFromValue(match.propertyValue);
    if (color !== null) {
      kind = CompletionItemKind.Color;

      // documentation = color;
      documentation = match.propertyValue;
    }

    let remToPxResult: string = "";

    if (match.cssObj.declarations.length === 1) {
      // atomic class
      const remUnit = extractRemUnit(match.propertyValue);
      if (remUnit) {
        remToPxResult = `=> ${replaceRemToPx(
          match.propertyValue,
          rootFontSizeInPx
        )}`;
      }
    }

    if (!documentation) {
      documentation = {
        language: "css",
        value: match.cssObj.stringified,
      };
    }

    const item = new vscode.CompletionItem(match.label, kind);

    if (color || remToPxResult.length) {
      item.detail = `${match.property}: ${match.propertyValue}; ${remToPxResult}`;
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

  return completions;
}

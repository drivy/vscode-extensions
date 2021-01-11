import * as vscode from "vscode";
import { MarkupKind } from "vscode-languageserver";
import { getColorFromValue } from "../util/color";
import { CompletionItemKind } from "vscode";
import { convertRemToPx, extractRemUnit } from "../util/css-units";

const tailwindSizeSortWeights = [
  ["2xs", 1],
  ["xs", 2],
  ["sm", 3],
  ["md", 4],
  ["lg", 5],
  ["2xl", 7],
  ["xl", 6],
];

const ROOT_FONT_SIZE = 16;

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

export function getCompletionsFromPartialClassName(
  partialClassName: string,
  replacementRange: any,
  cssRules: any[],
  classPrefix: string | undefined,
  shouldInsertExtraWhiteSpace: boolean = false
) {
  // console.log('partialClassName', partialClassName);

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

    if (match.cssObj.declarations.length === 1) {
      // atomic class
      const remUnit = extractRemUnit(match.propertyValue);
      if (remUnit) {
        extraDetails = `=> ${convertRemToPx(remUnit)}`;
      }
    }

    if (!documentation) {
      documentation = {
        language: "css",
        value: match.cssObj.stringified,
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

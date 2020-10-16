import * as vscode from "vscode";
import * as path from "path";
import * as css from "css";
import {
  buildHtmlJavascriptProvider,
  buildHamlProvider,
} from "./completion/providers";

export function activate(context: vscode.ExtensionContext) {
  const utilitiesFileRawPath:
    | string
    | undefined = vscode.workspace
    .getConfiguration()
    .get("cssClassesCompletion.utilitiesFilePath");

  const classPrefix: string | undefined =
    vscode.workspace
      .getConfiguration()
      .get("cssClassesCompletion.classPrefix") || undefined;

  if (!vscode.workspace.rootPath) {
    return console.log("You must have a workspace opened.");
  }

  if (!utilitiesFileRawPath) {
    return console.log("You must defined the utility classes file path.");
  }

  let cssRules: any[] = [];

  const utilitiesFilePathes = utilitiesFileRawPath
    .split(",")
    .map((path) => path.trim());

  for (let i = 0; i < utilitiesFilePathes.length; i++) {
    var filePath = path.join(
      "" + vscode.workspace.rootPath,
      utilitiesFilePathes[i]
    );
    var openPath = vscode.Uri.file(filePath);
    vscode.workspace.openTextDocument(openPath).then((doc) => {
      if (cssRules.length === 0) {
        const parsedCss = css.parse(doc.getText());

        if (parsedCss != null) {
          (parsedCss as any).stylesheet.rules
            .map((rule: any) => {
              return {
                ...rule,
                stringified: css.stringify({
                  type: "stylesheet",
                  stylesheet: { rules: [rule] },
                }),
              };
            })
            .forEach((rule: any) => cssRules.push(rule));
        }
      }
    });
  }

  context.subscriptions.push(
    buildHtmlJavascriptProvider(cssRules, classPrefix),
    buildHamlProvider(cssRules, classPrefix)
  );
}

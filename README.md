# vscode-extensions

## developer mode

Open the extension project in VS Code

`F5` to launch the extension: VS Code will open a new isolated window with the extension installed.
With the code source window, you can look at the console view, reload or stop the extension.

## package an extension

Ensure that vsce is installed

```
npm install -g vsce
```

Then package the extension with the following command

```
$ cd myExtension
$ vsce package
```

More information [here](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## locally install (VSIX) in VS Code

- In the extension panel, click on the `...` menu (top right) and select `install from VSIX`
- locate the VSIX file and select it
- Configure the extension ( locate the extension in the extension list then show its menu and select `Extension settings`)
- Reload VS Code

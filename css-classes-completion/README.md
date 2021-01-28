# CSS Classes Completion

CSS classes completion based on a CSS utilities file.

Compatible with a TailwindCSS generated file.

# Useage

Given a CSS utilities file, the extension will parse the CSS classes to provide completion and documentation in a "class list" context.

# Supported Files

The following file extensions are supported:
- html
- js
- ts
- tsx
- haml

## Features

### Class Completion

Class completion will be triggered when encountering the `-` char in a "class list" context.
You can force display of the completion list by hitting `ctrl + space`

![completion](media/doc/completion-feature.gif)

### Reverse Completion (searching for classname by CSS property)

You can search for a utility class by typing the matching CSS property.

![reverse completion feature](media/doc/reverse-completion-feature.gif)

### Color Preview

Atomic classes setting a text color or a background-color will get a color preview embedded in their completion making it easy to select the correct one.

![color preview](media/doc/color-bg-feature.png) ![color preview](media/doc/color-text-feature.png)

### REM To PX Convertion

This extension will automatically convert `rem` to `px` values as extra documentation comments.
The conversion will be done using the `root font-size in pixel` setting value (default: 16)

![rem to px](media/doc/rem-to-px-feature.png)

### Hover Documentation

Mousing over a utility class will display the related CSS property values applied.

![hover feature](media/doc/hover-feature.gif)

## Installation

Please configure the extension settings, then reload your IDE

### Extension Settings

- CSS file paths: the relative path to your CSS utilities file. Depending on your project, your file could be in differents places. You can define multiple paths by separating them with a `,`

  ```
  Example:

  node_modules/my-module-name/my-css-file.css
  ```

- Class prefix: If your utility classes contain a prefix, please define it there (separator included).
  Example: with classes like `c-mr-sm`, `c-rounded`, the prefix should be `c-`.

- Root font-size in pixels: Font-size in pixels of your body document (default: 16px). It will be used to convert `rem` values to `px`.
  
- Extra white space: to add an extra white space on completion validation. 

### Make It Work With TailwindCSS

This extension is designed to work with a list of CSS classes defined in a CSS file in your workspace (which can be imported from a node dependency aka `node_modules` folder).
It won't look for and parse an existing TailwindCSS configuration file.

If your TailwindCSS configuration file is in the same project as the one you want this extension to work on, the official extension may be the one you're looking for.

If you want to use this extension for its features or any other reason, you need to generate the TailwindCSS result file every time you change your TailwindCSS configuration file, and configure the correct `CSS file paths` setting. 

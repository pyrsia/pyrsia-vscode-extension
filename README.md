# Pyrsia VS Code Extension

## Overview

Pyrsia support for Microsoft VS Code (extension).**This is an early prototype and proof of concept, it’s not "production" ready.**

## Requirements

- VS Code 1.7
- Node 19.x required

## How to run and debug the extension

- Open the repo folder in VS Code.
- Install the dependencies and compile the extension.

    ```sh
    npm install
    npm run watch
    ```

- Open VS Code, in the Activity Bar select "Run and Debug" and make sure the "Lunch Extension" configuration is selected.
- Press F5 to run the Pyrsia extension (debug mode), a new VS Code instance will appear and should have the Pyrsia extension installed (should be shown in the Activity Bar).

## How to test the project (and debug the tests)

```sh
npm run test
```

To debug the tests, in the Activity Bar select "Run and Debug" and make sure the "Lunch Tests" configuration the active one, press F5 to start the tests.

## Before merging or creating PR

- Run the tests and linter.

    ```sh
    npm run compile
    npm run lint
    npm run test
    ```

## How to package, install and uninstall Pyrsia extension in the IDE

The Pyrsia extension is not available in the VS Code store yet, it's necessary to manually install the extension as described below.

### Install extension (side-load extension)

- Download the latest version of the extension (vsix file) from the [project release page](https://github.com/pyrsia/pyrsia-vscode-extension/releases).

- Close the IDE and install the extension using the `vsix` file downloaded in the previous step.

    ```sh
    code --install-extension <PYRSIA_VSIX_FILE_PATH>
    ```

### Build package and install extension from the local repository  (side-load extension)

- Install [Visual Studio Code Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce) with the following command.

    ```sh
    npm install -g @vscode/vsce
    ```

- In the extension repository folder package the extension as follows.

    ```sh
   vsce package --allow-star-activation --ignoreFile .vscodeignore --pre-release
    ```

- If the packaging was successful the last line of the VSCE logs should contain the `vsix` file path, for example:

    ```sh
    DONE  Packaged: /home/joed/repositories/pyrsia-vscode-extension/pyrsia-integration-0.0.1.vsix (960 files, 2.2MB)
    ```

- Close the IDE and install the extension using the `vsix` file path from the previous step.

    ```sh
    code --install-extension <PYRSIA_VSIX_FILE_PATH>
    ```
  
### Uninstall (side-load)

- Find the extension in the list of the extensions (look for "pyrsia", for example `undefined_publisher.pyrsia-integration`).

    ```sh
    code --list-extensions
    ```

- Use the extension name from the list to uninstall the extension.

    ```sh
    code --uninstall-extension <PYRSIA_EXTENSION_NAME>
    ```

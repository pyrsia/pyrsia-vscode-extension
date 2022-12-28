import { Uri, Webview } from "vscode";
import { NodeConfig } from "../model/NodeConfig";
import path = require("path");
import * as vscode from 'vscode';

export class Util {

  private static resourcePath: string;

  static init(context: vscode.ExtensionContext): void {
    Util.resourcePath = context.asAbsolutePath(path.join('resources'));
  }

  static getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
  }
  
  // TODO This should be obtained from the pyrsia node config
  static getNodeConfig(): NodeConfig {
    return new NodeConfig(); // TODO Replace it with the configuration obtained from the ide cache/storage
  }
  
  static getResourcePath(): string {
    return Util.resourcePath;
  }

  static getResourceImagePath(): string {
    return path.join(Util.resourcePath, "images");
  }
}



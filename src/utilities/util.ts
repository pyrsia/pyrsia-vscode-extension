import { Uri, Webview } from "vscode";
import { NodeConfig } from "../model/NodeConfig";
import path = require("path");
import * as vscode from 'vscode';

export class Util {

	private static resourcePath: string;
	// TODO Replace it with real, persistance storage
	private static config: NodeConfig = new NodeConfig();

	static init(context: vscode.ExtensionContext): void {
		Util.resourcePath = context.asAbsolutePath(path.join('resources'));
	}

	static getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
		return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
	}

	static getNodeConfig(): NodeConfig {
		return this.config; // TODO Replace it with the configuration obtained from the ide cache/storage
	}

	static getResourcePath(): string {
		return Util.resourcePath;
	}

	static getResourceImagePath(): string {
		return path.join(Util.resourcePath, "images");
	}
}


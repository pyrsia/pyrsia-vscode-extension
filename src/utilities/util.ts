import { Uri, Webview } from "vscode";
import { NodeConfig } from "../model/NodeConfig";

export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

// TODO This should be obtained from the pyrsia node config
export function getNodeConfig() : NodeConfig {
  return new NodeConfig(); // TODO Replace it with the configuration obtained from the ide cache/storage
}

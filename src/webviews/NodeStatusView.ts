import * as vscode from 'vscode';
import { NodeProvider } from "../nodeProvider";
import { Util } from "../utilities/util";

export class NodeStatusViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "pyrsia.node";

	private nodeProvider;
	private _view?: vscode.WebviewView;
	private extensionUri: vscode.Uri;
	private readonly onDidConnectListeners: Set<NodeStatusViewListener> = new Set<NodeStatusViewListener>();

	constructor(private readonly context: vscode.ExtensionContext) {
		this.nodeProvider = new NodeProvider();

		vscode.window.registerWebviewViewProvider(
			NodeStatusViewProvider.viewType,
			this
		);

		this.extensionUri = context.extensionUri;
	}

	public getWebView(): vscode.WebviewView {
		return this._view as vscode.WebviewView;
	}

	onDidConnect(listener: NodeStatusViewListener): void {
		this.onDidConnectListeners.add(listener);
	}

	public resolveWebviewView(view: vscode.WebviewView) {
		this._view = view;

		view.webview.options = {
			enableScripts: true
		};

		view.webview.html = this.getWebviewContent(view.webview, this.extensionUri);
		this.setWebviewMessageListener(view);

		view.onDidChangeVisibility((): void => {
			this.updateView();
		});

		this.updateView();
	}

	public async updateView() {
		const connected: boolean = await this.nodeProvider.isNodeHealthy();
		if (connected) {
			this.connected();
		} else {
			this.disconnected();
		}
	}

	private getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {

		const toolkitUri = Util.getUri(webview, extensionUri, [
			"node_modules",
			"@vscode",
			"webview-ui-toolkit",
			"dist",
			"toolkit.js"
		]);

		const mainUri = Util.getUri(webview, extensionUri, ["src", "webview-ui", "main.js"]);
		const stylesUri = Util.getUri(webview, extensionUri, ["src", "webview-ui", "styles.css"]);
		const pyrsiaHostname = this.nodeProvider.getHostname();

		return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">

          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script type="module" src="${toolkitUri}"></script>
              <script type="module" src="${mainUri}"></script>
              <link rel="stylesheet" href="${stylesUri}">
              <title>Node</title>
          </head>

          <body>
              <div id="node-container">
                  <div id="node-connected" none>
                      <div>🟢 Connected to <b><a href="${pyrsiaHostname}/status">${pyrsiaHostname}</a></b></div>
                  </div>

                  <div id="node-disconnected">
                      <div>🔴 Failed connecting to <b><a href="${pyrsiaHostname}/status">${pyrsiaHostname}</a></b></div>
                      <div class="break"></div>
                      <div>👉 Please make sure Pyrsia is <a title="How to install pyrsia"
                              href="https://pyrsia.io/docs/tutorials/quick-installation/"> installed</a>,
                          <a title="How to start pyrsia node"
						   href="https://pyrsia.io/docs/tutorials/quick-installation/">
                              running</a> and <a title="Update Pyrsia configuration" href=""> configured.</a>. 👈
                      </div>
                      <div class="break"></div>
                      <button id="node-button-connect">Connect</button>
                  </div>

              </div>
          </body>

      </html>
		`;
	}

	private setWebviewMessageListener(view: vscode.WebviewView) {
		view.webview.onDidReceiveMessage((message) => {
			const { command } = message;
			switch (command) {
				case "node-update-view": {
					this.updateView();
					break;
				}
				default: {
					throw new Error(`Command ${command} not found`);
				}
			}
		});
	}

	private connected() {
		const view = this._view;
		if (view) {
			let nodeStatus: unknown;
			this.nodeProvider.getStatus().then((data) => {
				nodeStatus = data;
			}).finally(() => {
				view.webview.postMessage({ nodeStatus, type: 'node-connected' });
				for (const listener of this.onDidConnectListeners) {
					listener.onDidConnect();
				}
			});
		}
	}

	private disconnected() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'node-disconnected' });
		}
		for (const listener of this.onDidConnectListeners) {
			listener.onDidConnect();
		}
	}
}

export interface NodeStatusViewListener {
	onDidConnect(): void;
}

import * as vscode from "vscode";
import * as client from "../utilities/pyrsiaClient";
import { Util } from "../utilities/Util";
import { IntegrationsView } from "./IntegrationsView";

export class ConnectionStatusBar {
	public static readonly updateStatusBarCommandId: string = "pyrsia.status-bar.update"; // NOI18N
	public static readonly showMessageStatusBarCommandId: string = "pyrsia.status-bar.show-message"; // NOI18N
	public static readonly configNodeCommandId = "pyrsia.node-config.update-url"; // NOI18N
	private readonly statusBar;

	constructor(context: vscode.ExtensionContext) {
		// create a new status bar item that we can now manage
		this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.statusBar.command = ConnectionStatusBar.showMessageStatusBarCommandId;
		context.subscriptions.push(this.statusBar);

		// register the command to update the Pyrsia connection status bar
		const updateStatusBarCommand = vscode.commands.registerCommand(ConnectionStatusBar.updateStatusBarCommandId, async () => {
			await this.updateStatusBar();
		});
		context.subscriptions.push(updateStatusBarCommand);

		// register the show message command
		const showMessageStatusBarCommand = vscode.commands.registerCommand(ConnectionStatusBar.showMessageStatusBarCommandId, async () => {
			await this.clickOnStatusBarShowMessage();
		});
		context.subscriptions.push(showMessageStatusBarCommand);

		// Add a command to update the Pyrsia node configuration (actually just URL)
		const configureNodeCommand = vscode.commands.registerCommand(
			ConnectionStatusBar.configNodeCommandId,
			async () => {
				// the update node url input box
				const options: vscode.InputBoxOptions = {
					prompt: "Update the Pyrsia node address (e.g. localhost:7888)",
					validateInput(value) {
						let errorMessage: string | undefined;
						console.debug(`Node configuration input: ${value}`);
						if (!value.toLocaleLowerCase().startsWith(Util.getNodeConfig.prototype)) {
							value = `${Util.getNodeConfig().protocol}://${value}`;
						}
						try {
							new URL(value);
						} catch (error) {
							errorMessage =
								"Incorrect Pyrsia node address, please provide a correct address (e.g localhost:7888)";
						}

						return errorMessage;
					},
					value: Util.getNodeConfig().host
				};
				context.subscriptions.push(configureNodeCommand);

				// show the url input box so the user can provide a new node address
				Util.getNodeConfig().url = await vscode.window.showInputBox(options);
				await this.updateStatusBar();
				IntegrationsView.requestIntegrationsUpdate();
				// check the new url connection
				const healthy = await client.isNodeHealthy();
				if (!healthy) {
					vscode.window.showErrorMessage(`Not able to connect to Pyrsi node '${Util.getNodeConfig().url}',
					please make sure the Pyrsia is node is online.'`);
				}
			}
		);
		context.subscriptions.push(configureNodeCommand);
		this.updateStatusBar();
	}

	private async updateStatusBar() {
		const connected: boolean = await client.isNodeHealthy();
		this.statusBar.text = connected ? "🟢 Pyrsia Connected" : "🔴 Pyrsia Disconnected";
		this.statusBar.show();
		Util.nodeConnected = connected;
	}

	private async clickOnStatusBarShowMessage() {
		const connected: boolean = await client.isNodeHealthy();
		const nodeConfig = Util.getNodeConfig();
		if (connected) {
			vscode.window.showInformationMessage(`Connected, Pyrsia node '${nodeConfig.host}'`);
		} else {
			const connectOptions = "Connect";
			const result = await vscode.window.showErrorMessage(`Not connect, Pyrsia node '${nodeConfig.host}'`, connectOptions);
			if (result === connectOptions) {
				vscode.commands.executeCommand(ConnectionStatusBar.configNodeCommandId);
			}
		}
	}
}



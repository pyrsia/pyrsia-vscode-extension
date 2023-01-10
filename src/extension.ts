import * as vscode from "vscode";
import { NodeConfigView } from "./webviews/NodeConfigView";
// import { NodeStatusViewProvider } from "./webviews/NodeStatusView";
import { IntegrationsView as IntegrationsView } from "./webviews/IntegrationsView";
import { Util } from "./utilities/util";
import { HelpView } from "./webviews/HelpView";
import { Integration } from "./integrations/api/Integration";
import { DockerIntegration } from "./integrations/impl/DockerIntegration";

export const activate = (context: vscode.ExtensionContext) => {
	// initialize the util
	Util.init(context);

	// Node status web view provider, this is debug only view, disabled for now
	//new NodeStatusViewProvider(context);

	// Create integrations
	const dockerIntegration: Integration = new DockerIntegration(context);

	// Node status config view
	const nodeConfigView = new NodeConfigView(context);
	nodeConfigView.addIntegration(dockerIntegration);

	// Node status config view
	const integrationView = new IntegrationsView(context);
	integrationView.addIntegration(dockerIntegration);

	// Node status config view
	new HelpView(context);

	//Notify the Node Config View when connected to node
	// nodeView.onDidConnect({
	// 	onDidConnect() {
	// 		nodeConfigView.update();
	// 	},
	// });
};

export const deactivate = () => {
	console.log("Pyrsia extension deactivated"); // TODO
};

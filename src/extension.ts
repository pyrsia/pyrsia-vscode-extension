import * as vscode from "vscode";
import { NodeConfigView } from "./webviews/NodeConfigView";
// import { NodeStatusViewProvider } from "./webviews/NodeStatusView";
import { IntegrationsView as IntegrationsView } from "./webviews/IntegrationsView";
import { Util } from "./utilities/Util";
import { HelpView } from "./webviews/HelpView";
import { Integration } from "./api/Integration";
import { DockerIntegration } from "./integrations/DockerIntegration";

export const activate = (context: vscode.ExtensionContext) => {
	// Init the extension utils
	Util.init(context);

	// Create docker integration
	const dockerIntegration: Integration = new DockerIntegration(context);

	// Create the node config view
	const nodeConfigView = new NodeConfigView(context);
	nodeConfigView.addIntegration(dockerIntegration);

	// Create the integrations view
	const integrationView = new IntegrationsView(context);
	integrationView.addIntegration(dockerIntegration);

	// Create Help view
	new HelpView(context);
};

export const deactivate = () => {
	console.debug("Pyrsia extension deactivated");
};

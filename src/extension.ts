import * as vscode from "vscode";
import { IntegrationsView as IntegrationsView } from "./views/IntegrationsView";
import { Util } from "./utilities/Util";
import { HelpView } from "./views/HelpView";
import { Integration } from "./api/Integration";
import { DockerIntegration } from "./integrations/DockerIntegration";
import { ConnectionStatusBar } from "./views/ConnectionStatusBar";

export const activate = (context: vscode.ExtensionContext) => {
	// Init the extension utils
	Util.init(context);

	// Create docker integration
	const dockerIntegration: Integration = new DockerIntegration(context);

	// Create the integrations view
	const integrationView = new IntegrationsView(context);
	integrationView.addIntegration(dockerIntegration);

	// Create Help view
	new HelpView(context);

	// Create Status Bar
	new ConnectionStatusBar(context);
};

export const deactivate = () => {
	console.debug("Pyrsia extension deactivated");
};

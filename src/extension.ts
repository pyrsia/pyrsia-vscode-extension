import * as vscode from 'vscode';
import { NodeConfigView } from './webviews/NodeConfigView';
// import { NodeStatusViewProvider } from './webviews/NodeStatusView';
import { NodeIntegrationsView } from './webviews/NodeIntegrationsView';
import { Util } from './utilities/util';
import { HelpView } from './webviews/HelpView';

export const activate = (context: vscode.ExtensionContext) => {

	console.log('Pyrsia extension activated');

	// initialize the util
	Util.init(context);

	// Node status web view provider
	//new NodeStatusViewProvider(context);

	// Node status config view
	new NodeConfigView(context);

	// Node status config view
	new NodeIntegrationsView(context);

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

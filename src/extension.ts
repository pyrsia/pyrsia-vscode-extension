import * as vscode from 'vscode';
import { NodeConfigView } from './webviews/NodeConfigView';
import { NodeStatusViewProvider } from './webviews/NodeStatusView';
import { NodeIntegrationsView } from './webviews/NodeIntegrationsView';
import { Util } from './utilities/util';

export async function activate(context: vscode.ExtensionContext) {

	console.log('Pyrsia extension activated');

	// initialize the util
	Util.init(context);

	// Node status web view provider
	const nodeView = new NodeStatusViewProvider(context);
	// Node status config view
	const nodeConfigView = new NodeConfigView(context);

	// Node status config view
	new NodeIntegrationsView(context);

	//Notify the Node Config View when connected to node
	nodeView.onDidConnect({
		onDidConnect() {
			nodeConfigView.update();
		},
	});

	// nodeView.onDidConnect(new NodeViewListener {

	// });
	
	// const startNode = vscode.commands.registerCommand('pyrsia.startNode', (a) => {
	// 	// nodeProvider.isNodeHealthy;
	// 	console.log(a);
	// });

	// const stopNode = vscode.commands.registerCommand('pyrsia.stopNode', () => {
	// 	//nodeProvider.stop();
	// 	console.log("something");
	// });

	//context.subscriptions.push(startNode, stopNode);
}

// export function deactivate() {}
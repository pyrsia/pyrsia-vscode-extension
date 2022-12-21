import * as vscode from 'vscode';
import { NodeConfigView } from './webviews/NodeConfigView';
import { NodeViewProvider } from './webviews/NodeViewProvider';

export function activate(context: vscode.ExtensionContext) {

	console.log('Pyrsia extension activated');

	const nodeView = new NodeViewProvider(context);
	const nodeConfigView = new NodeConfigView(context);

	//Notify the Node Config View when connected to node
	nodeView.onDidConnect({
		onDidConnect() {
			nodeConfigView.update();
		},
	});

	// nodeView.onDidConnect(new NodeViewListener {

	// });
	
	// let startNode = vscode.commands.registerCommand('pyrsia.isNodeHealthy', () => {
	// 	nodeProvider.isNodeHealthy;
	// });

	// let stopNode = vscode.commands.registerCommand('pyrsia.stopNode', () => {
	// 	nodeProvider.stop();
	// });

	// context.subscriptions.push(startNode, stopNode);
}

// export function deactivate() {}
/* eslint-disable @typescript-eslint/member-ordering */
// https://github.com/xojs/eslint-config-xo-typescript/issues/43
/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { Integration, IntegrationTreeItem, Event } from '../api/Integration'; // NOI18N

/**
 * Integrations view.
 */
export class IntegrationsView {
	private static readonly refreshIntegrationModelCommandId: string = "pyrsia.integrations.model.update"; // NOI18N
	private static readonly refreshIntegrationViewCommandId: string = "pyrsia.integrations.view.update"; // NOI18N
	private static readonly refreshIntegrationCommandId: string = "pyrsia.integrations.update"; // NOI18N
	private static readonly viewType: string = "pyrsia.node-integrations"; // NOI18N
	
	private readonly treeViewProvider: IntegrationsTreeProvider;
	private readonly _view?: vscode.TreeView<string>;

	constructor(context: vscode.ExtensionContext) {
		this.treeViewProvider = new IntegrationsTreeProvider();
		this._view = vscode.window.createTreeView(
			IntegrationsView.viewType,
			{ showCollapseAll: true, treeDataProvider: this.treeViewProvider }
		);
		this.treeViewProvider.update();

		// register update model command
		vscode.commands.registerCommand(IntegrationsView.refreshIntegrationModelCommandId, () => {
			this.treeViewProvider.update();
		});

		// register update view command
		vscode.commands.registerCommand(IntegrationsView.refreshIntegrationViewCommandId, () => {
			this.treeViewProvider.updateTreeView();
		});

		// register command that update both - mode and view
		vscode.commands.registerCommand(IntegrationsView.refreshIntegrationCommandId, () => {
			this.treeViewProvider.update();
			this.treeViewProvider.updateTreeView();
		});

		// triggered the update when view is shown
		this._view.onDidChangeVisibility(() => {
			this.treeViewProvider.update();
		});

		// triggered the update on the selection change
		this._view.onDidChangeSelection(() => {
			this.treeViewProvider.update();
		});

		context.subscriptions.push(this._view);
	}

	/**
	 * Requests update view.
	 * @returns {void}
	 */
	static requestIntegrationsViewUpdate() {
		vscode.commands.executeCommand(this.refreshIntegrationViewCommandId);
	}

	/**
	 * Requests update view and model.
	 * @returns {void}
	 */
	static requestIntegrationsUpdate() {
		vscode.commands.executeCommand(this.refreshIntegrationCommandId);
	}

	/**
	 * Add an integration instance for the Integrations view (e.g. DockerIntegration, etc)
	 * @param {Integration} integration (e.g DockerIntegration)
	 * @returns {void}
	 */
	addIntegration(integration: Integration) {
		this.treeViewProvider.addIntegration(integration);
	}

	/**
	 * Triggers the tree provider update.
	 * @returns {Promise<void>} void
	 */
	async update(): Promise<void> {
		if (this.treeViewProvider) {
			await this.treeViewProvider.update();
		}
	}
}

/**
 * Integration view tree provider.
 */
class IntegrationsTreeProvider implements vscode.TreeDataProvider<string> {
	// on change tree data
	private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> =
		new vscode.EventEmitter<string | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;
	// integrations (e.g. DockerIntegration)
	private readonly integrations: Set<Integration> = new Set<Integration>();

	addIntegration(integration: Integration): void {
		this.integrations.add(integration);
	}

	getTreeItem(id: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
		let treeItem: IntegrationTreeItem | undefined;

		for (const integration of this.integrations.values()) {
			treeItem = integration.getTreeItem(id);
		}

		if (!treeItem) {
			throw new Error(`Tree item ${id} doesn't exist.`);
		}

		return treeItem;
	}

	getChildren(parentId?: string | undefined): vscode.ProviderResult<string[]> {
		console.debug(parentId);
		let children: string[] = [];
		for (const integration of this.integrations) {
			children = children.concat(integration.getTreeItemChildren(parentId));
		}

		return children;
	}

	update(): void {
		for (const integration of this.integrations) {
			integration.update(Event.IntegrationModelUpdate);
		}
	}

	resolveTreeItem?(
		item: vscode.TreeItem,
		element: string,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.TreeItem> {
		console.debug(element);
		console.debug(token);
		return item;
	}

	// fires the tree view update (UI)
	updateTreeView(): void {
		this._onDidChangeTreeData.fire(undefined);
	}
}

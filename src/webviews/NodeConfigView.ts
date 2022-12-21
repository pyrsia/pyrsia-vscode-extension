// https://github.com/xojs/eslint-config-xo-typescript/issues/43
/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as util from '../utilities/util';
import * as client from '../utilities/client';

// TODO With branches
// enum NodeConfigProperty {
// 	Hostname = "hostname", // NO I18
// 	Port = "port", // NO I18
// 	HostnameValue = "hostnamevalue", // NO I18
// 	PortValue = "portvalue", // NO I18
// 	Peers = "peers", // NO I18
// 	PeersValue = "peersvalue", // NO I18
// }

// TODO Without branches
enum NodeConfigProperty {
	Hostname = "hostname", // NO I18
	Port = "port", // NO I18
	// HostnameValue = "hostnamevalue", // NO I18
	// PortValue = "portvalue", // NO I18
	Peers = "peers", // NO I18
	// PeersValue = "peersvalue", // NO I18
}

export class NodeConfigView {
	private static readonly viewType: string = "pyrsia.node-config"; // NO I18
	private readonly treeViewProvider: NodeConfigTreeProvider;

	constructor(context: vscode.ExtensionContext) {
		this.treeViewProvider = new NodeConfigTreeProvider();
		const view = vscode.window.createTreeView(NodeConfigView.viewType, { treeDataProvider: this.treeViewProvider, showCollapseAll: true });
		vscode.window.registerTreeDataProvider(NodeConfigView.viewType, this.treeViewProvider);

		context.subscriptions.push(view);

		vscode.commands.registerCommand('pyrsia.node-config.tree.refresh', () => {
			this.treeViewProvider.update();
		});

		view.onDidChangeVisibility(() => {
			this.treeViewProvider.update();
		});
	}

	public update(): void {
		this.treeViewProvider.update();
	}
}


// TODO This is the tree provider which returns branches
// class NodeConfigTreeProvider implements vscode.TreeDataProvider<string> {

// 	private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> = new vscode.EventEmitter<string | undefined | null | void>();
// 	readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;

// 	private treeItems: Map<string, NodeTreeItem> = new Map<string, NodeTreeItem>();

// 	async update() {
// 		for (const nodeProperty in NodeConfigProperty) { // TODO Why nodeProperty is 'string' type? Investigate
// 			const treeItem = this.treeItems.get(nodeProperty.toLocaleLowerCase());
// 			if (treeItem) {
// 				await treeItem.update();
// 			}
// 		}

// 		this._onDidChangeTreeData.fire();
// 	}

// 	getTreeItem(id: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
// 		const treeItem = this.treeItems.get(id);
// 		if (!treeItem) {
// 			throw new Error(`Tree item ${id} doesn't exist.`);
// 		}

// 		return treeItem;
// 	}

// 	getChildren(parentId?: string | undefined): vscode.ProviderResult<string[]> {
// 		let childrenArray: string[] = [];
// 		if (!parentId) { // Create all tree Items for the tree
// 			for (const nodeProperty in NodeConfigProperty) { // TODO Why nodeProperty is 'string' type? Investigate
// 				const treeItem = this.treeItems.get(nodeProperty.toLowerCase());
// 				if (!treeItem) {
// 					const enumType = NodeConfigProperty[nodeProperty as keyof typeof NodeConfigProperty]; // TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
// 					this.treeItems.set(nodeProperty.toLocaleLowerCase(), NodeTreeItem.create(enumType)); // TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
// 				}
// 			}
// 			childrenArray = [... this.treeItems].map(([, value]) => {
// 				return value.isRoot() ? value.id : "";
// 			}).filter(value => value !== "");
// 		} else { // not tree root then get the particular id for the parentId
// 			const childId = NodeTreeItem.getChildrenId(parentId);
// 			const treeItem: NodeTreeItem = this.treeItems.get(childId) as NodeTreeItem;
// 			childrenArray = [treeItem.id];
// 		}

// 		return childrenArray;
// 	}
// }

// class NodeTreeItem extends vscode.TreeItem {

// 	constructor(
// 		public label: string,
// 		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
// 		public readonly id: string,
// 		public readonly root: boolean,
// 		private readonly listener: NodeConfigListener,
// 	) {
// 		super(label, collapsibleState);
// 		this.tooltip = this.label;
// 	}

// 	static create(nodeProperty: NodeConfigProperty): NodeTreeItem {
// 		const property = this.properties[nodeProperty];
// 		const collapsibleState = property.root ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
// 		return new NodeTreeItem(
// 			property.name,
// 			collapsibleState,
// 			property.id,
// 			property.root,
// 			property.listener,
// 		);
// 	}

// 	async update() {
// 		await this.listener.onUpdate(this);
// 	}

// 	isRoot(): boolean {
// 		return this.root;
// 	}

// 	static getChildrenId(parentId: string) {
// 		return `${parentId}value`;
// 	}

// 	private static readonly properties = {
// 		[NodeConfigProperty.Hostname.toLowerCase()]: {
// 			name: "Hostname",
// 			id: "hostname", // NO I18
// 			root: true,
// 			listener: {
// 				onUpdate: async () => {
// 					console.log(`Nothing to update - ${this.name}`);
// 				}
// 			},
// 		}, [NodeConfigProperty.HostnameValue.toLowerCase()]: {
// 			name: "Getting node hostname...",
// 			id: "hostnamevalue", // NO I18
// 			root: false,
// 			listener: {
// 				onUpdate: async (treeItem: NodeTreeItem) => {
// 					treeItem.label = util.getNodeConfig().hostname;
// 				}
// 			},
// 		},
// 		[NodeConfigProperty.Port.toLowerCase()]: {
// 			name: "Port",
// 			id: "port", // NO I18
// 			root: true,
// 			listener: {
// 				onUpdate: async () => {
// 					console.log(`Nothing to update - ${this.name}`);
// 				}
// 			},
// 		},
// 		[NodeConfigProperty.PortValue.toLowerCase()]: {
// 			name: "Getting node port...",
// 			id: "portvalue", // NO I18
// 			root: false,
// 			listener: {
// 				onUpdate: async (treeItem: NodeTreeItem) => {
// 					treeItem.label = util.getNodeConfig().port;
// 				}
// 			},
// 		},
// 		[NodeConfigProperty.Peers.toLowerCase()]: {
// 			name: "Peers Count",
// 			id: "peers", // NO I18
// 			root: true,
// 			listener: {
// 				onUpdate: async () => {
// 					console.log(`Nothing to update - ${this.name}`);
// 				}
// 			},
// 		},
// 		[NodeConfigProperty.PeersValue.toLowerCase()]: {
// 			name: "Getting node peers...",
// 			id: "peersvalue", // NO I18
// 			root: false,
// 			listener: {
// 				onUpdate: async (treeItem: NodeTreeItem) => {
// 					const peers = await client.getPeers();
// 					treeItem.label = peers.toString();
// 					treeItem.tooltip = peers.toString();
// 					console.log(`Updating - ${this.name}`);
// 				}
// 			},
// 		},
// 	};
// }


// TODO This is flat tree (no branches)
class NodeConfigTreeProvider implements vscode.TreeDataProvider<string> {

	private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> = new vscode.EventEmitter<string | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;

	private treeItems: Map<string, NodeTreeItem> = new Map<string, NodeTreeItem>();

	async update() {
		for (const nodeProperty in NodeConfigProperty) { // TODO Why nodeProperty is 'string' type? Investigate
			const treeItem = this.treeItems.get(nodeProperty.toLocaleLowerCase());
			if (treeItem) {
				await treeItem.update();
			}
		}

		this._onDidChangeTreeData.fire();
	}

	getTreeItem(id: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
		const treeItem = this.treeItems.get(id);
		if (!treeItem) {
			throw new Error(`Tree item ${id} doesn't exist.`);
		}

		return treeItem;
	}

	getChildren(parentId?: string | undefined): vscode.ProviderResult<string[]> {
		let childrenArray: string[] = [];
		if (!parentId) { // Create all tree Items for the tree
			for (const nodeProperty in NodeConfigProperty) { // TODO Why nodeProperty is 'string' type? Investigate
				const treeItem = this.treeItems.get(nodeProperty.toLowerCase());
				if (!treeItem) {
					const enumType = NodeConfigProperty[nodeProperty as keyof typeof NodeConfigProperty]; // TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
					this.treeItems.set(nodeProperty.toLocaleLowerCase(), NodeTreeItem.create(enumType)); // TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
				}
			}
			childrenArray = [... this.treeItems].map(([, value]) => {
				return value.isRoot() ? value.id : "";
			}).filter(value => value !== "");
		} else { // not tree root then get the particular id for the parentId
			const childId = NodeTreeItem.getChildrenId(parentId);
			const treeItem: NodeTreeItem = this.treeItems.get(childId) as NodeTreeItem;
			childrenArray = [treeItem.id];
		}

		return childrenArray;
	}
}

class NodeTreeItem extends vscode.TreeItem {

	constructor(
		public label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly id: string,
		public readonly root: boolean,
		private readonly listener: NodeConfigListener,
	) {
		super(label, collapsibleState);
		this.tooltip = this.label;
	}

	static create(nodeProperty: NodeConfigProperty): NodeTreeItem {
		const property = this.properties[nodeProperty];
		const collapsibleState = vscode.TreeItemCollapsibleState.None;
		return new NodeTreeItem(
			property.name,
			collapsibleState,
			property.id,
			property.root,
			property.listener,
		);
	}

	async update() {
		await this.listener.onUpdate(this);
	}

	isRoot(): boolean {
		return this.root;
	}

	static getChildrenId(parentId: string) {
		return `${parentId}value`;
	}

	private static readonly properties = {
		[NodeConfigProperty.Hostname.toLowerCase()]: {
			name: "Host",
			id: "hostname", // NO I18
			root: true,
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const name = NodeTreeItem.properties[NodeConfigProperty.Hostname.toLowerCase()].name;
					treeItem.label = `${name}: ${util.getNodeConfig().hostname}`;
				}
			}
		},
		[NodeConfigProperty.Port.toLowerCase()]: {
			name: "Port",
			id: "port", // NO I18
			root: true,
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const name = NodeTreeItem.properties[NodeConfigProperty.Port.toLowerCase()].name;
					treeItem.label = `${name}: ${util.getNodeConfig().port}`;
				}
			},
		},
		[NodeConfigProperty.Peers.toLowerCase()]: {
			name: "Peers Count",
			id: "peers", // NO I18
			root: true,
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const peers = await client.getPeers();
					const name = NodeTreeItem.properties[NodeConfigProperty.Peers.toLowerCase()].name;
					treeItem.label = `${name}: ${peers.toString()}`;
					treeItem.tooltip = `${name}: ${peers.toString()}`;
					console.log(`Updating - ${name}`);
				}
			},
		},
	};
}


interface NodeConfigListener {
	onUpdate(treeItem: NodeTreeItem): void;
}
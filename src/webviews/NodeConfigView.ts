// https://github.com/xojs/eslint-config-xo-typescript/issues/43
/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { Util } from '../utilities/util';
import * as client from '../utilities/client';
import { HelpUtil } from './HelpView';

// TODO With branches
// enum NodeConfigProperty {
// 	Hostname = "hostname",  // NOI18
// 	Port = "port",  // NOI18
// 	HostnameValue = "hostnamevalue",  // NOI18
// 	PortValue = "portvalue",  // NOI18
// 	Peers = "peers",  // NOI18
// 	PeersValue = "peersvalue",  // NOI18
// }

// TODO Without branches
enum NodeConfigProperty {
	Status = "status",
	// Hostname = "hostname", // NOI18
	// Port = "port", // NOI18
	// HostnameValue = "hostnamevalue", // NOI18
	// PortValue = "portvalue", // NOI18
	Peers = "peers", // NOI18
	Error1 = "error1",
	Error2 = "error2",
	// PeersValue = "peersvalue", // NOI18
}

export class NodeConfigView {
	public static readonly configNodeCommandId = "pyrsia.configurenode";

	private static readonly viewType: string = "pyrsia.node-config"; // NOI18
	private readonly treeViewProvider: NodeConfigTreeProvider;
	private readonly view;

	constructor(context: vscode.ExtensionContext) {
		this.treeViewProvider = new NodeConfigTreeProvider();
		this.view = vscode.window.createTreeView(
			NodeConfigView.viewType,
			{ showCollapseAll: true, treeDataProvider: this.treeViewProvider }
		);
		vscode.window.registerTreeDataProvider(NodeConfigView.viewType, this.treeViewProvider);

		context.subscriptions.push(this.view);

		vscode.commands.registerCommand('pyrsia.node-config.tree.refresh', () => {
			this.treeViewProvider.update();
		});

		this.view.onDidChangeVisibility(() => {
			this.treeViewProvider.update();
		});

		// docker open and update configuration editor command for the docker integration
		const configureNodeCommand = vscode.commands.registerCommand(
			NodeConfigView.configNodeCommandId,
			async () => {
				const options: vscode.InputBoxOptions = {
					prompt: "Update the Pyrsia node address (e.g. localhost:7888)",
					validateInput(value) {
						let errorMessage: string | undefined;
						console.info(`Node configuration input: ${value}`);
						if (!value.toLocaleLowerCase().startsWith("http")) {
							value = `http://${value}`;
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

				// show the input box so user can provide a new node address
				const newNodeAddress: string | undefined = await vscode.window.showInputBox(options);
				Util.getNodeConfig().url = newNodeAddress;

				// update the UI
				this.update();
			}
		);

		context.subscriptions.push(configureNodeCommand);

		// trigger data and UI updates for the first time
		setTimeout(() => {
			this.update();
		}, 1000);

		// update the UI every minute
		setInterval(() => {
			this.update();
		}, 60000);
	}

	public update(): void {
		this.treeViewProvider.update();
		client.isNodeHealthy().then((healthy) => {
			healthy ? this.view.title = "NODE STATUS  🟩" : this.view.title = "NODE STATUS  🟥";
		});
	}
}

// TODO This is flat tree (no branches)
class NodeConfigTreeProvider implements vscode.TreeDataProvider<string> {

	private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> =
		new vscode.EventEmitter<string | undefined | null | void>();

	// eslint-disable-next-line @typescript-eslint/member-ordering
	readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;

	private readonly treeItems: Map<string, NodeTreeItem>;

	constructor() {
		this.treeItems = new Map<string, NodeTreeItem>();
		for (const nodeProperty in NodeConfigProperty) { // TODO Why nodeProperty is 'string' type? Investigate
			const treeItem = this.treeItems.get(nodeProperty.toLowerCase());
			if (!treeItem) {
				// TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
				const enumType = NodeConfigProperty[nodeProperty as keyof typeof NodeConfigProperty];
				// TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
				this.treeItems.set(nodeProperty.toLocaleLowerCase(), NodeTreeItem.create(enumType));
			}
		}
	}

	update() {
		for (const nodeProperty in NodeConfigProperty) { // TODO Why nodeProperty is 'string' type? Investigate
			const treeItem = this.treeItems.get(nodeProperty.toLocaleLowerCase());
			if (treeItem) {
				treeItem.update();
			}
		}

		// refresh the tree
		setTimeout(() => {
			this._onDidChangeTreeData.fire();
		}, 1000);
	}

	getTreeItem(id: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
		const treeItem = this.treeItems.get(id);
		if (!treeItem) {
			throw new Error(`Tree item ${id} doesn't exist.`);
		}

		return treeItem;
	}

	getChildren(parentId?: string | undefined): vscode.ProviderResult<string[]> {
		let children: string[] = [];
		if (!parentId) { // Create all tree Items for the tree
			children = [... this.treeItems].map(([, value]) => {
				return value.isRoot() ? value.id : "";
			}).filter(value => value !== "");
		} else { // not tree root then get the particular id for the parentId
			const childId = NodeTreeItem.getChildrenId(parentId);
			const treeItem: NodeTreeItem = this.treeItems.get(childId) as NodeTreeItem;
			children = [treeItem.id];
		}

		return children;
	}
}

class NodeTreeItem extends vscode.TreeItem {

	// reusable icons
	private static readonly emptyIcon = new vscode.ThemeIcon("non-icon");
	private static readonly rightArrowIcon = new vscode.ThemeIcon("arrow-right");
	private static readonly cloudIcon = new vscode.ThemeIcon("cloud");
	private static readonly brokenConnectionIcon = new vscode.ThemeIcon("alert");
	private static readonly peersCountIcon = new vscode.ThemeIcon("extensions-install-count");
	private static readonly properties = {
		[NodeConfigProperty.Status.toLowerCase()]: {
			iconPath: NodeTreeItem.cloudIcon,
			id: "status", // NOI18
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const healthy: boolean = await client.isNodeHealthy();
					const { host } = Util.getNodeConfig();
					const status: string = healthy ? `Connected to '${host}'` : `Failed connecting to '${host}'`;
					treeItem.label = status;
					treeItem.iconPath = healthy ? NodeTreeItem.cloudIcon : NodeTreeItem.brokenConnectionIcon;
					treeItem.command = { command: NodeConfigView.configNodeCommandId, title: "Configure Pyrsia Node" };
				}
			},
			name: "Status",
			root: true
		},
		[NodeConfigProperty.Peers.toLowerCase()]: {
			iconPath: NodeTreeItem.peersCountIcon,
			id: "peers", // NOI18
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const health = await client.isNodeHealthy();
					if (health) {
						const peers = await client.getPeers();
						const { name } = NodeTreeItem.properties[NodeConfigProperty.Peers.toLowerCase()];
						treeItem.label = `${name}: ${peers.toString()}`;
						treeItem.iconPath = NodeTreeItem.peersCountIcon;
					} else { // don't show the item content 
						treeItem.label = "";
						treeItem.iconPath = NodeTreeItem.emptyIcon;
					}
				}
			},
			name: "Node peers",
			root: true
		},
		[NodeConfigProperty.Error1.toLowerCase()]: {
			iconPath: NodeTreeItem.emptyIcon,
			id: "error1", // NOI18
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const healthy: boolean = await client.isNodeHealthy();
					treeItem.label = healthy ? "" : "👋 Read how to install and configure Pyrsia";
					const iconPath = healthy ? NodeTreeItem.emptyIcon : NodeTreeItem.rightArrowIcon;
					treeItem.iconPath = iconPath;
					treeItem.command = healthy ? undefined : {
						arguments: [HelpUtil.quickStartUrl],
						command: HelpUtil.helpCommandId,
						title: "Open Pyrsia Help"
					};
				}
			},
			name: "",
			root: true
		},
		[NodeConfigProperty.Error2.toLowerCase()]: {
			iconPath: NodeTreeItem.emptyIcon,
			id: "error2", // NOI18
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const healthy: boolean = await client.isNodeHealthy();
					treeItem.label = healthy ? "" : "👋 Update Pyrsia node configuration";
					treeItem.command = healthy ? undefined : {
						command: NodeConfigView.configNodeCommandId,
						title: "Configure Pyrsia Node"
					};
				}
			},
			name: "",
			root: true
		}
	};

	constructor(
		public label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly id: string,
		public readonly root: boolean,
		private readonly listener: NodeConfigListener,
		public iconPath: vscode.ThemeIcon
	) {
		super(label, collapsibleState);
		this.tooltip = this.label;
	}

	static create(nodeProperty: NodeConfigProperty): NodeTreeItem {
		const property = this.properties[nodeProperty];
		const collapsibleState = vscode.TreeItemCollapsibleState.None;
		return new NodeTreeItem(
			"Connecting to Pyrsia...",
			collapsibleState,
			property.id,
			property.root,
			property.listener,
			property.iconPath
		);
	}

	static getChildrenId(parentId: string) {
		return `${parentId}value`;
	}

	update() {
		this.listener.onUpdate(this);
	}

	isRoot(): boolean {
		return this.root;
	}
}

interface NodeConfigListener {
	onUpdate(treeItem: NodeTreeItem): void;
}

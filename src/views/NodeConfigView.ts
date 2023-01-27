// https://github.com/xojs/eslint-config-xo-typescript/issues/43
/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as client from "../utilities/pyrsiaClient";
import { HelpUtil } from "./HelpView";
import { Event, Integration } from "../api/Integration";
import { IntegrationsView } from "./IntegrationsView";
import { Util } from "../utilities/Util";

enum NodeConfigProperty {
	Status = "status", // NOI18N
	Peers = "peers", // NOI18N
	WarningConnection = "warningconnection", // NOI18N
	WarningUpdateNode = "warningupdatenode", // NOI18N
}

/**
 * Node Config view.
 */
export class NodeConfigView {
	// Ids (view, commands)
	public static readonly configNodeCommandId = "pyrsia.node-config.update-url"; // NOI18N
	private static readonly viewType: string = "pyrsia.node-config"; // NOI18N
	private static readonly updateViewCommandId = "pyrsia.node-config.update-view"; // NOI18N

	private readonly treeViewProvider: NodeConfigTreeProvider;
	private readonly view: vscode.TreeView<string>;
	private readonly integrations: Set<Integration> = new Set<Integration>();

	constructor(context: vscode.ExtensionContext) {
		// create the view provider
		this.treeViewProvider = new NodeConfigTreeProvider();
		// create the tree view
		this.view = vscode.window.createTreeView(
			NodeConfigView.viewType,
			{ showCollapseAll: true, treeDataProvider: this.treeViewProvider }
		);
		// register the view provider
		vscode.window.registerTreeDataProvider(NodeConfigView.viewType, this.treeViewProvider);
		// subscribe the node config view
		context.subscriptions.push(this.view);
		// register the update view node (responsible for the view update on certain events)
		vscode.commands.registerCommand(NodeConfigView.updateViewCommandId, () => {
			this.update();
			this.notifyNodeConfigUpdated();
		});
		// update the view (UI/model) on certain view events
		this.view.onDidChangeVisibility(() => {
			this.update();
			this.treeViewProvider.update();
		});

		// Add a command to update the Pyrsia node configuration (actually just URL)
		const configureNodeCommand = vscode.commands.registerCommand(
			NodeConfigView.configNodeCommandId,
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

				// show the url input box so the user can provide a new node address
				const newNodeAddress: string | undefined = await vscode.window.showInputBox(options);
				Util.getNodeConfig().url = newNodeAddress;
				// update the view and the dependencies
				this.update();
				// notify the integrations about the change
				this.notifyNodeConfigUpdated();
				IntegrationsView.requestIntegrationsUpdate();
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

	// update the view
	public update(): void {
		this.treeViewProvider.update();
		client.isNodeHealthy().then((healthy) => {
			healthy ? this.view.title = "NODE STATUS  🟢" : this.view.title = "NODE STATUS  🔴";
			Util.nodeConnected = healthy;
		});
	}

	// adds integration (mostly so there is a way to notify them about the changes)
	public addIntegration(integration: Integration): void {
		this.integrations.add(integration);
	}

	// notify the integrations (e.g. Docker) about the changes
	private notifyNodeConfigUpdated() {
		for (const integration of this.integrations) {
			integration.update(Event.NodeConfigurationUpdate);
			integration.update(Event.IntegrationModelUpdate);
		}
	}
}

// Tree data provider for the node config
class NodeConfigTreeProvider implements vscode.TreeDataProvider<string> {
	// update the tree on changes
	private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> =
		new vscode.EventEmitter<string | undefined | null | void>();
	// eslint-disable-next-line @typescript-eslint/member-ordering
	readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;
	// tree items
	private readonly treeItems: Map<string, NodeTreeItem>;

	constructor() {
		this.treeItems = new Map<string, NodeTreeItem>();
		for (const nodeProperty in NodeConfigProperty) {
			const treeItem = this.treeItems.get(nodeProperty.toLowerCase());
			if (!treeItem) {
				// TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
				const enumType = NodeConfigProperty[nodeProperty as keyof typeof NodeConfigProperty];
				// TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
				this.treeItems.set(nodeProperty.toLocaleLowerCase(), NodeTreeItem.create(enumType));
			}
		}
	}

	// update the tree data
	update() {
		for (const nodeProperty in NodeConfigProperty) {
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
		if (!parentId) {
			children = [... this.treeItems].map(([, value]) => {
				return value.isRoot() ? value.id : "";
			}).filter(value => value !== "");
		} else {
			const childId = NodeTreeItem.getChildrenId(parentId);
			const treeItem: NodeTreeItem = this.treeItems.get(childId) as NodeTreeItem;
			children = [treeItem.id];
		}

		return children;
	}
}

/**
 * Node config tree item
 */
class NodeTreeItem extends vscode.TreeItem {
	// tree item icons
	private static readonly emptyIcon = new vscode.ThemeIcon("non-icon"); // NOI18N
	private static readonly rightArrowIcon = new vscode.ThemeIcon("arrow-right"); // NOI18N
	private static readonly cloudIcon = new vscode.ThemeIcon("cloud"); // NOI18N
	private static readonly brokenConnectionIcon = new vscode.ThemeIcon("alert"); // NOI18N
	private static readonly peersCountIcon = new vscode.ThemeIcon("extensions-install-count"); // NOI18N

	// Tree item properties and the logic to update it.
	private static readonly properties = {
		[NodeConfigProperty.Status.toLowerCase()]: {
			iconPath: NodeTreeItem.cloudIcon,
			id: "status", // NOI18N
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const healthy: boolean = await client.isNodeHealthy();
					const { host } = Util.getNodeConfig();
					const status: string = healthy ? `Connected to Pyrsia: '${host}'` : `Failed connecting to Pyrsia node: '${host}'`;
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
			id: "peers", // NOI18N
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const health = await client.isNodeHealthy();
					if (health) {
						const peers = await client.getPeers();
						const { name } = NodeTreeItem.properties[NodeConfigProperty.Peers.toLowerCase()];
						treeItem.label = `${name}: ${peers.toString()}`;
						treeItem.iconPath = NodeTreeItem.peersCountIcon;
					} else { // don't show the item content is connection is broken
						treeItem.label = "";
						treeItem.iconPath = NodeTreeItem.emptyIcon;
					}
				}
			},
			name: "Node peers",
			root: true
		},
		[NodeConfigProperty.WarningConnection.toLowerCase()]: {
			iconPath: NodeTreeItem.emptyIcon,
			id: "warningconnection", // NOI18N
			listener: {
				onUpdate: async (treeItem: NodeTreeItem) => {
					const healthy: boolean = await client.isNodeHealthy();
					treeItem.label = healthy ? "" : "👋 Read how to install and configure Pyrsia";
					treeItem.iconPath = healthy ? NodeTreeItem.emptyIcon : NodeTreeItem.rightArrowIcon;
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
		[NodeConfigProperty.WarningUpdateNode.toLowerCase()]: {
			iconPath: NodeTreeItem.emptyIcon,
			id: "warningupdatenode", // NOI18N
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

	public static create(nodeProperty: NodeConfigProperty): NodeTreeItem {
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

	public static getChildrenId(parentId: string) {
		return `${parentId}value`;
	}

	public update() {
		this.listener.onUpdate(this);
	}

	public isRoot(): boolean {
		return this.root;
	}
}

/**
 * Node Config Tree Item update interface
 */
interface NodeConfigListener {
	onUpdate(treeItem: NodeTreeItem): void;
}

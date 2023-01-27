// https://github.com/xojs/eslint-config-xo-typescript/issues/43
/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

// Help list enum
enum HelpProperty {
	Install = "install",
	Tutorials = "tutorials",
	Overview = "overview",
	Github = "github",
	Issue = "issue",
}

/**
 * Help Util class, don't create instances of this class.
 * TODO Do we need this one?
 */
export class HelpUtil {
	public static readonly helpCommandId = "pyrsia.openHelpLink"; // NOI18N
	public static readonly quickStartUrl = "https://pyrsia.io/docs/tutorials/quick-installation/"; // NOI18N
}

/**
 * Pyrsia Help view.
 */
export class HelpView {
	private static readonly viewType: string = "pyrsia.help"; // NOI18N
	private readonly treeViewProvider: HelpTreeProvider;

	constructor(context: vscode.ExtensionContext) {
		this.treeViewProvider = new HelpTreeProvider();
		const view = vscode.window.createTreeView(
			HelpView.viewType,
			{ showCollapseAll: true, treeDataProvider: this.treeViewProvider }
		);
		vscode.window.registerTreeDataProvider(HelpView.viewType, this.treeViewProvider);
		// create the open external help link command
		const openHelpLink = vscode.commands.registerCommand(HelpUtil.helpCommandId, (helpUrl: string) => {
			console.debug(`Open ${helpUrl} using '${HelpUtil.helpCommandId}'`); // NOI18N
			vscode.env.openExternal(vscode.Uri.parse(helpUrl));
		});
		// register the open external help link command
		context.subscriptions.push(openHelpLink);
		// register the help view
		context.subscriptions.push(view);
	}
}

/**
 * Help tree provider.
 */
class HelpTreeProvider implements vscode.TreeDataProvider<string> {
	private treeItems: Map<string, HelpTreeItem> = new Map<string, HelpTreeItem>();

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
			for (const nodeProperty in HelpProperty) { // TODO Why nodeProperty is 'string' type? Investigate
				const treeItem = this.treeItems.get(nodeProperty.toLowerCase());
				if (!treeItem) {
					// TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
					const enumType = HelpProperty[nodeProperty as keyof typeof HelpProperty];
					// TODO Why I have to do this conversion in TS? Shouldn't 'nodeProperty' be the enum type?
					this.treeItems.set(nodeProperty.toLocaleLowerCase(), HelpTreeItem.create(enumType));
				}
			}
			children = [... this.treeItems].map(([, value]) => {
				return value.id;
			}).filter(value => value !== "");
		} else {
			const childId = HelpTreeItem.getChildrenId(parentId);
			const treeItem: HelpTreeItem = this.treeItems.get(childId) as HelpTreeItem;
			children = [treeItem.id];
		}

		return children;
	}
}

/**
 * Help Tree Item
 */
class HelpTreeItem extends vscode.TreeItem {

	private static readonly properties = {
		[HelpProperty.Install.toLowerCase()]: {
			iconPath: new vscode.ThemeIcon("getting-started-beginner"), // NOI18N
			id: "install", // NOI18N
			name: "Pyrsia Quick Installation",
			url: HelpUtil.quickStartUrl
		},
		[HelpProperty.Overview.toLowerCase()]: {
			iconPath: new vscode.ThemeIcon("open-editors-view-icon"), // NOI18N
			id: "overview", // NOI18N
			name: "Read Pyrsia Documentation",
			url: "https://pyrsia.io/docs/" // NOI18N
		},
		[HelpProperty.Tutorials.toLowerCase()]: {
			iconPath: new vscode.ThemeIcon("play-circle"), // NOI18N
			id: "tutorials", // NOI18N
			name: "Watch Pyrsia Tutorials",
			url: "https://www.youtube.com/@pyrsiaoss/playlists" // NOI18N
		},
		[HelpProperty.Github.toLowerCase()]: {
			iconPath: new vscode.ThemeIcon("github"), // NOI18N
			id: "github", // NOI18N
			name: "Get Involved",
			url: "https://github.com/pyrsia" // NOI18N
		},
		[HelpProperty.Issue.toLowerCase()]: {
			iconPath: new vscode.ThemeIcon("remote-explorer-report-issues"), // NOI18N
			id: "issue", // NOI18N
			name: "Report Issue",
			url: "https://github.com/pyrsia/pyrsia/issues" // NOI18N
		}
	};

	constructor(
		public label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly id: string,
		public readonly iconPath: vscode.ThemeIcon,
		readonly helpUrl: string
	) {
		super(label, collapsibleState);
		this.command = { arguments: [helpUrl], command: HelpUtil.helpCommandId, title: "Open Pyrsia Help" };
		this.tooltip = this.label;
	}

	static create(nodeProperty: HelpProperty): HelpTreeItem {
		const property = this.properties[nodeProperty];
		const collapsibleState = vscode.TreeItemCollapsibleState.None;
		return new HelpTreeItem(
			property.name,
			collapsibleState,
			property.id,
			property.iconPath,
			property.url
		);
	}

	static getChildrenId(parentId: string) {
		return `${parentId}value`;
	}
}

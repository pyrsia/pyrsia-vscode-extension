import * as vscode from 'vscode';

export interface Integration {

    getTreeItem(treeItemId: string): IntegrationTreeItem | undefined;

    getTreeItemChildren(): string[];

    getId(): string;

    update(): void;

}

export abstract class IntegrationTreeItem extends vscode.TreeItem {

    constructor(
		public label: string,
		public readonly id: string,
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = this.label;
	}

    abstract update(): void;

}


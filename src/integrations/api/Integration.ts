import * as vscode from 'vscode';
// https://github.com/xojs/eslint-config-xo-typescript/issues/43
/* eslint-disable @typescript-eslint/naming-convention */

// Help list
export enum Event {
	IntegrationModelUpdate,
	NodeConfigurationUpdate,
}

export interface Integration {

	getTreeItem(treeItemId: string): IntegrationTreeItem | undefined;

	getTreeItemChildren(parentId?: string): string[];

	getId(): string;

	update(event: Event): void;

}

export abstract class IntegrationTreeItem extends vscode.TreeItem {

	abstract update(context: never): void;

}


// https://github.com/xojs/eslint-config-xo-typescript/issues/43
/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';

// Integration events
export enum Event {
   IntegrationModelUpdate,
   NodeConfigurationUpdate,
}

/**
* Integration interface (e.g. DockerIntegration.ts, maven, etc).
* It allows plugging a new tree into and commands the integration view.
*/
export interface Integration {

   /**
    * Get a tree item for the provided tree item ID.
    * @param {string} treeItemId tree item id
    * @returns {IntegrationTreeItem} integration tree item
    */
   getTreeItem(treeItemId: string): IntegrationTreeItem | undefined;

   /**
    * Returns an array of children ids (treeItemId).
    * @param {string} parentId
    * @returns {string[]} array of children IDs (treeItemId)
    */
   getTreeItemChildren(parentId?: string): string[];

   /**
    * This method is called by the external source and notifies the integration about a specific event.
    * @param {Integration.Event} event
    */
   update(event: Event): void;
}

/**
* Integration Tree Item class
*/
export abstract class IntegrationTreeItem extends vscode.TreeItem {
   abstract update(context: never): void;
}

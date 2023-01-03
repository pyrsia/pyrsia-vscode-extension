import * as os from "os";
import * as fsUtils from "../utilities/fsUtils";
import { Integration, IntegrationTreeItem } from "./Integration";
import * as path from 'path';
import { Util } from "../utilities/util";
import * as vscode from 'vscode';

export class Docker implements Integration {

	static readonly commandId = "pyrsia.openUpdateDockerConfFile";
	private static readonly integrationId: string = "docker";
	private static confMap: Map<string, string> = new Map<string, string>();
	private static pyrsiaConfigCode = `  "registry-mirrors": ["http://0.0.0.0:7888"] \n`;

	private readonly treeItems: Map<string, IntegrationTreeItem> = new Map<string, IntegrationTreeItem>();

	static {
		Docker.confMap.set(path.join(os.homedir(), ".docker"), "config.json");
	}

	constructor(context: vscode.ExtensionContext) {

		// docker open and update configuration editor command for the docker integration
		const openDockerUpdateConfFile = vscode.commands.registerCommand(Docker.commandId, (confFilePath: string) => {
			console.log(confFilePath);
			const setting: vscode.Uri = vscode.Uri.parse(`${confFilePath}`);

			vscode.workspace.openTextDocument(setting).then((textDocument: vscode.TextDocument) => {
				vscode.window.showTextDocument(textDocument, 1, false).then(async (textEditor) => {
					const confirmOption = "Yes";
					const cancelOption = "No";
					const result = await vscode.window.showInformationMessage(
						"Add Pyrsia to the Docker configuration?",
						confirmOption,
						cancelOption
					);

					if (result === confirmOption) {
						const ls = textDocument.lineCount;
						textEditor.edit(edit => {
							// TODO This is a prototype, not even close to the real solution.
							const line = textDocument.lineAt(ls - 3);
							edit.delete(line.range);
							edit.insert(new vscode.Position(line.lineNumber, 0), `${line.text},`);
							edit.insert(new vscode.Position(ls - 2, 0), Docker.pyrsiaConfigCode);
						});
						// TODO Update the selection?
						textEditor.selection = new vscode.Selection(
							new vscode.Position(2, 2),
							new vscode.Position(2, Docker.pyrsiaConfigCode.length + 2)
						);
						textDocument.save();
					}
				});
			}, (error: unknown) => {
				console.error(error);
			});

		});

		context.subscriptions.push(openDockerUpdateConfFile);
	}

	getTreeItem(treeItemId: string): IntegrationTreeItem | undefined {
		return this.treeItems.get(treeItemId);
	}

	getId(): string {
		return Docker.integrationId;
	}

	update(): void {
		// find docker conf file (macos, linux)
		for (const confPath of Docker.confMap.keys()) {
			const fileName = Docker.confMap.get(confPath);
			if (!fileName) {
				throw new Error("Configuration file name cannot be null");
			}
			fsUtils.findByName(confPath, fileName).then((confFilePath) => {
				if (confFilePath) {
					const treeItemId = `${this.getId()}-${confFilePath}`;
					const label = `${confFilePath}`;
					this.treeItems.set(treeItemId, new DockerTreeItem(label, treeItemId, confFilePath));
				} else {
					console.log(`No configuration for 'Docker' - ${path.join(confPath, fileName)}`);
				}
			});
		}
	}

	getTreeItemChildren(): string[] {
		const children: string[] = [];
		for (const label of this.treeItems.keys()) {
			children.push(label);
		}

		return children;
	}
}

class DockerTreeItem extends IntegrationTreeItem {

	constructor(
		public label: string,
		public readonly id: string,
		public readonly confFilePath: string
	) {
		super(label, id);
		// const command = new class implements vscode.Command {
		//     title: string;
		//     command: string;
		//     tooltip?: string | undefined;
		//     arguments?: any[] | undefined;
		//     run() {
		//         console.log("Docker open File");
		//     }
		// }();
		// command.title = "Open Docker Configuration";
		// command.command = "command-open-docker-node";
		// command.tooltip = command.title;
		// super.command = command;
		this.command = {
			arguments: [confFilePath],
			command: Docker.commandId,
			title: "Open Docker configuration file"
		};

	}

	// command?: vscode.Command | undefined = new class implements vscode.Command {
	//     title: string;
	//     command: string;
	//     tooltip?: string | undefined;
	//     arguments?: any[] | undefined;
	//     run() {
	//       console.log("Docker open File");
	//     }
	//   }();

	update(): void {
		throw new Error("Method not implemented.");
	}

	// eslint-disable-next-line @typescript-eslint/member-ordering
	iconPath = {
		dark: path.join(Util.getResourceImagePath(), "docker_small.svg"), //TODO update to dark
		light: path.join(Util.getResourceImagePath(), "docker_small.svg")
	};
}

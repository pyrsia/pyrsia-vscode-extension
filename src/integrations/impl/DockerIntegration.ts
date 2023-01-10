import * as os from "os";
import * as fsUtils from "../../utilities/fsUtils";
import { Event, Integration, IntegrationTreeItem } from "../api/Integration";
import * as path from 'path';
import { Util } from "../../utilities/util";
import * as vscode from "vscode";
import * as client from "../../utilities/pyrsiaClient";
import { IntegrationsView } from "../../webviews/IntegrationsView";

export class DockerIntegration implements Integration {
	//confirm options
	static readonly confirmOption = "Yes";
	static readonly cancelOption = "No";
	
	// command Ids
	static readonly updateDockerConfCommandId = "pyrsia.update-docker-conf";
	static readonly replaceDockerImagesCommandId = "pyrsia.replace-docker-images";
	private static readonly openDockerTransparencyLog = "pyrsia.open-docker-trans-log";
	private static readonly integrationId: string = "pyrsia.docker";
	private static readonly requestBuildId: string = "pyrsia.request-docker-build";

	// context values
	// eslint-disable-next-line @typescript-eslint/member-ordering
	static readonly imageNotPyrsia = `${DockerIntegration.integrationId}.not-pyrsia`;
	// eslint-disable-next-line @typescript-eslint/member-ordering
	static readonly imagePyrsia = `${DockerIntegration.integrationId}.is-pyrsia`;

	// tree item ids
	// eslint-disable-next-line @typescript-eslint/member-ordering
	static readonly configFileItemId: string = `${this.integrationId}.configfile`;
	private static readonly configItemId: string = `${this.integrationId}.configs`;
	private static readonly imagesItemId: string = `${this.integrationId}.images`;
	private static readonly imageItemId: string = `${this.integrationId}.dockerimage`;

	// docker config files search path
	private static confMap: Map<string, string> = new Map<string, string>();
	private static readonly registryMirrorsConfName = "registry-mirrors";
	
	// item names
	private static readonly dockerTreeItemName = "Docker";
	private static warningIconPath: vscode.ThemeIcon = new vscode.ThemeIcon("warning"); // NOI18

	private readonly treeItems: Map<string, IntegrationTreeItem> = new Map<string, IntegrationTreeItem>();
	private readonly dockerIconPath: { light: string | vscode.Uri; dark: string | vscode.Uri; };

	static {
		DockerIntegration.confMap.set(path.join(os.homedir(), ".docker"), "daemon.json");
	}
	
	constructor(context: vscode.ExtensionContext) {
		// get the icon paths
		this.dockerIconPath = {
			dark: path.join(Util.getResourceImagePath(), "docker_small.svg"), //TODO update to dark
			light: path.join(Util.getResourceImagePath(), "docker_small.svg") //TODO update to light
		};

		// create and add the "non-dynamic" docker tree items.
		this.createTreeItems(this.treeItems);

		// register the docker commands
		this.registerCommands(context);
	}

	private static getImageTreeId(imageName: string): string {
		return `${DockerIntegration.imageItemId}.${imageName}`;
	}

	async replaceImagesWithPyrsia(): Promise<void> {
		// look for docker images
		const dockerClient = Util.getDockerClient();
		const images = await dockerClient.listImages();
		const allContainers = await dockerClient.listContainers({ "all": true });
		images.forEach(async (imageInfo) => {
			const imageName = imageInfo.RepoTags?.join();
			// no image tags? => skip the image
			if (!imageName) {
				return;
			}
			// only update the images which are available  in Pyrsia
			const transImageLog: [] = await client.getDockerTransparencyLog(imageName);
			await this.updateModel();
			if (transImageLog.length > 0) {
				// remove the old images first
				try {
					// get all Pyrsia images relevant containers
					const containers = allContainers.filter((container) => {
						return container.Image === imageName;
					});
					if (containers.length > 0) {
						await vscode.window.showErrorMessage(
							// eslint-disable-next-line max-len
							`Replacing the docker images failed because '${imageName}' image 
							has containers, please remove the relevant docker containers and try again.`,
							"Close"
						);
						return;
					}
					// delete the image
					dockerClient.getImage(imageInfo.Id).remove({ force: true }, (error) => {
						if (error) {
							vscode.window.showErrorMessage(
								// eslint-disable-next-line max-len
								`Replacing the docker images failed because '${imageName}' image 
								has containers, please remove the relevant docker containers and try again.`,
								"Close"
							);
							return;
						}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						dockerClient.pull(imageName, (err: string, stream: any) => {
							console.log(err);
							const onFinished = (error_: unknown, output: unknown) => {
								console.info(`Error: ${error_}, ${output}`);
								this.treeItems.delete(DockerIntegration.getImageTreeId(imageName));
								IntegrationsView.requestIntegrationsModelUpdate();
								IntegrationsView.requestIntegrationsViewUpdate();
							};

							const onProgress = (event: unknown) => {
								console.log(event);
								const treeItem = this.treeItems.get(DockerIntegration.getImageTreeId(imageName));
								if (treeItem) {
									treeItem.label = `Replacing '${imageName}' with Pyrsia image.`;
									treeItem.iconPath = DockerImageTreeItem.iconPathPullDocker;
								}
								IntegrationsView.requestIntegrationsModelUpdate();
								IntegrationsView.requestIntegrationsViewUpdate();
							};
							dockerClient.modem.followProgress(stream, onFinished, onProgress);
						});
					});
				} catch (err) {
					Util.debugMessage(`Couldn't replace image: ${imageInfo.Labels}, error: ${err}`);
					IntegrationsView.requestIntegrationsModelUpdate();
					IntegrationsView.requestIntegrationsViewUpdate();
				}
			}
		});
	}

	getTreeItemChildren(parentId?: string | undefined): string[] {
		console.log(`${parentId}`);

		let children: string[] = [];
		switch (parentId) {
			case DockerIntegration.integrationId:
				children.push(DockerIntegration.configItemId, DockerIntegration.imagesItemId);
				break;
			case DockerIntegration.configItemId:
				// eslint-disable-next-line no-case-declarations
				const configItems = [... this.treeItems].map(([, value]) => {
					return value.id;
				}).filter(id => id?.includes(DockerIntegration.configFileItemId));
				children = children.concat((configItems as string[]));
				break;
			case DockerIntegration.imagesItemId:
				// eslint-disable-next-line no-case-declarations
				const imageItems = [... this.treeItems].map(([, value]) => {
					return value.id;
				}).filter(id => id?.includes(DockerIntegration.imageItemId));
				children = children.concat((imageItems as string[]));
				break;
			default:
				children.push(DockerIntegration.integrationId);
				break;
		}

		return children.sort();
	}

	getTreeItem(treeItemId: string): IntegrationTreeItem | undefined {
		return this.treeItems.get(treeItemId);
	}

	getId(): string {
		return DockerIntegration.integrationId;
	}

	async update(event: Event): Promise<void> {
		switch (event) {
			case Event.IntegrationModelUpdate: {
				await this.updateModel();
				break;
			}
			case Event.NodeConfigurationUpdate: {
				this.treeItems.forEach((treeItem: vscode.TreeItem) => {
					if (treeItem instanceof DockerConfigTreeItem) {
						vscode.commands.executeCommand(DockerIntegration.updateDockerConfCommandId, treeItem.confFilePath);
					}
				});
				break;
			}
			default:{
				this.updateModel();
			}
		}
		IntegrationsView.requestIntegrationsViewUpdate();
	}

	private async updateModel() {
		// check if the docker and node is up
		let isDockerUp = true;
		try {
			await Util.getDockerClient().ping();
		} catch (error) {
			isDockerUp = false;
		}
		const isPyrsiaNodeUp = await client.isNodeHealthy();
		// update the Docker tree item in case Docker or node is down
		const dockerTreeItem = this.treeItems.get(DockerIntegration.integrationId);
		if (dockerTreeItem && (!isDockerUp || !isPyrsiaNodeUp)) {
			// create warning tree item and hide the rest of the tree items 
			dockerTreeItem.label = `${DockerIntegration.dockerTreeItemName} (Pyrsia node or Docker is disconnected)`;
			dockerTreeItem.tooltip = "Please make sure that Docker service and Pyrsia node is up and configured";
			dockerTreeItem.iconPath = DockerIntegration.warningIconPath;
			dockerTreeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
			dockerTreeItem.command = undefined;
		} else {
			// recreate the docker tree item
			this.createDockerTreeItem();

			// find the docker conf file(s) (macos, linux). TODO Windows
			for (const confPath of DockerIntegration.confMap.keys()) {
				const fileName = DockerIntegration.confMap.get(confPath);
				if (!fileName) {
					throw new Error("Configuration file name cannot be null");
				}
				fsUtils.findByName(confPath, fileName).then((confFilePath) => {
					if (confFilePath) {
						const id = `${DockerIntegration.configFileItemId}.${confFilePath}`;
						const label = `${confFilePath}`;
						this.treeItems.set(
							id,
							new DockerConfigTreeItem(label, id, confFilePath, vscode.TreeItemCollapsibleState.None)
						);
					} else {
						console.log(`No configuration for 'Docker' - ${path.join(confPath, fileName)}`);
					}
				});
				IntegrationsView.requestIntegrationsViewUpdate();
			}

			// look for docker images
			const dockerClient = Util.getDockerClient();
			const images = await dockerClient.listImages();
			images.forEach(async (image) => {
				const imageName = image.RepoTags?.join();
				if (imageName?.startsWith("<none>")) {
					return;
				}
				// no image tags? => skip the image
				if (!imageName) {
					return;
				}
				const id = DockerIntegration.getImageTreeId(imageName);
				const imageItem = new DockerImageTreeItem(
					id,
					imageName
				);
				// check if image exists in pyrsia
				const transImageLog: [] = await client.getDockerTransparencyLog(imageName);
				imageItem.update({ pyrsia: transImageLog.length > 0 });

				// add item to the tree items map
				this.treeItems.set(id, imageItem);
			});
			IntegrationsView.requestIntegrationsViewUpdate();
		}
	}

	private registerCommands(context: vscode.ExtensionContext) {
		// docker command to open and update configuration editor command for the docker integration
		const openDockerUpdateConfFile = vscode.commands.registerCommand(
			DockerIntegration.updateDockerConfCommandId,
			(args: DockerConfigTreeItem | string) => {
				let confFilePath;
				if (args instanceof DockerConfigTreeItem) { // arg as tree item
					// eslint-disable-next-line prefer-destructuring
					confFilePath = args.confFilePath;
				} else if (typeof args === "string") { // arg as view item name (tree item name)
					const treeItem = this.treeItems.get(args);
					if (treeItem instanceof DockerConfigTreeItem) {
						confFilePath = treeItem?.confFilePath;
					} else {
						console.error(`Docker update command - tree item not found ${args}`);
					}
				} else {
					console.error(`Docker update command - tree item not found ${args}`);
				}
				const setting: vscode.Uri = vscode.Uri.parse(`${confFilePath}`);
				vscode.workspace.openTextDocument(setting).then((textDocument: vscode.TextDocument) => {
					// Get the docker config as JSON object
					const dockerConfigJson = JSON.parse(textDocument.getText());
					// Get the current node configuration
					const { host } = Util.getNodeConfig();
					// Check if the docker config has to be updated.
					let registryMirrors: string[] = dockerConfigJson[DockerIntegration.registryMirrorsConfName];
					let updateConfig = false;
					if (registryMirrors) {
						updateConfig = !!registryMirrors.find((mirror: string) => {
							return mirror.includes(host);
						});
					}
					vscode.window.showTextDocument(textDocument, 1, false).then(async (textEditor) => {
						if (updateConfig) {
							// the docker config doesn't have to be updated, exit
							return;
						}
						const confirmOption = "Yes";
						const cancelOption = "No";
						const result = await vscode.window.showInformationMessage(
							"Add Pyrsia to the Docker configuration?",
							confirmOption,
							cancelOption
						);

						if (result === confirmOption) {
							textEditor.edit(edit => {
								if (!registryMirrors) { // no mirrors found, add one for the pyrsia node
									registryMirrors = [];
									dockerConfigJson[DockerIntegration.registryMirrorsConfName] = registryMirrors;
								}
								// update document only when the docker config was updated
								registryMirrors.push(host);
								const updateDockerConfText = JSON.stringify(dockerConfigJson, null, 2);
								edit.replace(
									new vscode.Range(
										textDocument.lineAt(0).range.start,
										textDocument.lineAt(textDocument.lineCount - 1).range.end
									),
									updateDockerConfText
								);
								// select the changes
								const hostStartLocation = updateDockerConfText.lastIndexOf(host);
								textEditor.selection = new vscode.Selection(
									new vscode.Position(hostStartLocation, hostStartLocation),
									new vscode.Position(hostStartLocation, hostStartLocation + host.length)
								);
								textDocument.save();
								vscode.window.showWarningMessage("Please restart Docker to apply the configuration changes.");
							});
						}
					});
				}, (error: unknown) => {
					console.error(error);
				});
			}
		);

		// docker command to open and update configuration editor command for the docker integration
		const replaceDockerWithPyrsiaImages = vscode.commands.registerCommand(
			DockerIntegration.replaceDockerImagesCommandId,
			async () => {
				const result = await vscode.window.showInformationMessage(
					"👋 Are you sure you'd like to replace all local docker images with the Pyrsia images?",
					DockerIntegration.confirmOption,
					DockerIntegration.cancelOption
				);

				if (result === DockerIntegration.confirmOption) {
					this.replaceImagesWithPyrsia();
				}
			}
		);
		
		// request docker image build
		const requestDockerImageBuild = vscode.commands.registerCommand(
			DockerIntegration.requestBuildId,
			async (id: string) => {
				const treeItem = this.treeItems.get(id);
				if (treeItem && typeof treeItem.label === "string") {
					// ask if request the build
					const result = await vscode.window.showInformationMessage(
						`👋 Are you sure you'd like to add '${treeItem.label}' to Pyrsia?`,
						DockerIntegration.confirmOption,
						DockerIntegration.cancelOption
					);

					if (result === DockerIntegration.confirmOption) {
						const buildId = await client.requestDockerBuild(treeItem.label);
						let message;
						if (buildId) {
							message = `A request to add '${treeItem.label}' was successful, ID: ${buildId}`;
						} else {
							message = `A request to add '${treeItem.label}' was unsuccessful.`;
						}
						// show the result message
						vscode.window.showInformationMessage(message);
					}
				}
			}
		);

		// open docker image transparency log command
		const openDockerTransparencyLog = vscode.commands.registerCommand(
			DockerIntegration.openDockerTransparencyLog,
			async (id: string) => {
				const treeItem = this.treeItems.get(id);
				if (treeItem instanceof DockerImageTreeItem) {
					const transLogs: string[] = await client.getDockerTransparencyLog(treeItem.label);
					if (!transLogs) {
						return;
					}
					// parse and format the logs
					const formattedTransLogsJson = JSON.stringify({ [treeItem.label]: transLogs }, null, 2);
					// open and create a new editor and insert the transparency log
					const textDocument = await vscode.workspace.openTextDocument({ content: formattedTransLogsJson, language: "json" });
					await vscode.window.showTextDocument(textDocument);
				} else {
					console.error(`Docker update command - tree item not found ${id}`);
					return;
				}
			}
		);

		// subscribe the commands
		context.subscriptions.push(
			openDockerUpdateConfFile, // update docker file command
			replaceDockerWithPyrsiaImages, // replace docker images with pyrsia images
			requestDockerImageBuild, // request docker image build
			openDockerTransparencyLog // opens docker image transparency log in editor
		);
	}

	private createDockerTreeItem() {
		// create "Docker" tree item
		const dockerTreeItem = new DockerTreeItem(DockerIntegration.integrationId, "Docker", this.dockerIconPath);
		dockerTreeItem.contextValue = DockerIntegration.integrationId;
		this.treeItems.set(DockerIntegration.integrationId, dockerTreeItem);
	}

	private createTreeItems(treeItems: Map<string, vscode.TreeItem>) {
		// create "Docker" tree item
		this.createDockerTreeItem();

		// create Docker "Configuration" tree item
		treeItems.set(
			DockerIntegration.configItemId,
			new DockerTreeItem(
				DockerIntegration.configItemId,
				"Configuration",
				new vscode.ThemeIcon("gear") // NOI18
			)
		);

		// create docker "Images" tree item
		const imagesTreeItem = new DockerTreeItem(
			DockerIntegration.imagesItemId,
			"Images",
			new vscode.ThemeIcon("folder-library") // NOI18
		);
		imagesTreeItem.contextValue = DockerIntegration.integrationId;
		treeItems.set(
			DockerIntegration.imagesItemId,
			imagesTreeItem
		);
	}
}

class DockerConfigTreeItem extends IntegrationTreeItem {
	private static iconPath: vscode.ThemeIcon = new vscode.ThemeIcon("go-to-file"); // NOI18

	constructor(
		public label: string,
		public readonly id: string,
		public readonly confFilePath: string,
		public readonly collapsableState: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsableState);

		this.command = {
			arguments: [this],
			command: DockerIntegration.updateDockerConfCommandId,
			title: "Open Docker configuration file"
		};

		this.iconPath = DockerConfigTreeItem.iconPath;
		this.contextValue = DockerIntegration.configFileItemId;
	}

	update(): void {
		throw new Error("Method not implemented.");
	}
}

class DockerTreeItem extends IntegrationTreeItem {

	constructor(
		public readonly id: string,
		public readonly label: string,
		public readonly iconPath?: { light: string | vscode.Uri; dark: string | vscode.Uri; } | vscode.ThemeIcon | undefined
	) {
		super(label, vscode.TreeItemCollapsibleState.Expanded);
	}

	update(): void {
		console.log("Nothing to update in Docker integration tree item");
	}
}

class DockerImageTreeItem extends IntegrationTreeItem {
	static readonly iconPathPullDocker: vscode.ThemeIcon = new vscode.ThemeIcon("sync"); // NOI18
	private static readonly defaultIconPath: vscode.ThemeIcon = new vscode.ThemeIcon("archive"); // NOI18
	readonly pyrsiaIconPath: { dark: string, light: string };

	constructor(
		public readonly id: string,
		public readonly label: string
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.iconPath = DockerImageTreeItem.defaultIconPath;
		this.pyrsiaIconPath = {
			dark: path.join(Util.getResourceImagePath(), "pyrsia_white.svg"), //TODO update to dark
			light: path.join(Util.getResourceImagePath(), "pyrsia_white.svg") //TODO update to light
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	update(context: any): void {
		this.iconPath = context.pyrsia ? this.pyrsiaIconPath : DockerImageTreeItem.defaultIconPath;
		this.contextValue = context.pyrsia ? DockerIntegration.imagePyrsia : DockerIntegration.imageNotPyrsia;
	}
}

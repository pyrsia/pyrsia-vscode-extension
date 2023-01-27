/* eslint-disable @typescript-eslint/member-ordering */
import * as os from "os";
import { Event, Integration, IntegrationTreeItem } from "../api/Integration";
import * as path from 'path';
import { Util } from "../utilities/Util";
import * as vscode from "vscode";
import * as client from "../utilities/pyrsiaClient";
import { IntegrationsView } from "../views/IntegrationsView";

/**
 * Implements Docker support for Pyrsia.
 */
export class DockerIntegration implements Integration {
	//dialog options
	static readonly confirmOption = "Yes";
	static readonly cancelOption = "No";
	static readonly closeOption = "Close";

	// command Ids
	static readonly updateDockerConfCommandId = "pyrsia.docker.update-config"; // NOI18N
	static readonly reloadDockerImagesCommandId = "pyrsia.docker.replace-images"; // NOI18N
	private static readonly openDockerTransparencyLog = "pyrsia.docker.open-trans-log"; // NOI18N
	private static readonly integrationId: string = "pyrsia.docker"; // NOI18N
	private static readonly requestBuildId: string = "pyrsia.docker.request-build"; // NOI18N

	// context values
	static readonly imageNotPyrsiaContextValue = "pyrsia.docker.not-pyrsia"; // NOI18N
	static readonly imagePyrsiaContextValue = "pyrsia.docker.is-pyrsia"; // NOI18N
	static readonly imageUpdatingContextValue = "pyrsia.docker.updating"; // NOI18N

	// tree item ids
	static readonly configFileItemIdPrefix: string = "pyrsia.docker.config-file";
	private static readonly imageItemIdPrefix: string = "pyrsia.docker.docker-image";
	private static readonly configItemId: string = "pyrsia.docker.configs";
	private static readonly imagesItemId: string = "pyrsia.docker.images";

	// pre defined docker config files (this is where we look for the docker config)
	private static dockerConfigPathsMap: Map<string, string> = new Map<string, string>();
	// Used in the docker configuration logic (the property we have to update)
	private static readonly registryMirrorsName = "registry-mirrors";

	// 'static' tree items props
	private static readonly mainTreeItemName = "Docker";
	private static readonly configTreeItemName = "Configuration";
	private static readonly imagesTreeItemName = "Images";
	private static readonly warningIconPath: vscode.ThemeIcon = new vscode.ThemeIcon("warning"); // NOI18N
	private readonly mainTreeItemIconPath: { light: string | vscode.Uri; dark: string | vscode.Uri; };

	// this is where we store all of the tree items
	private readonly treeItems: Map<string, IntegrationTreeItem> = new Map<string, IntegrationTreeItem>();

	static {
		// TODO add support for windows!
		DockerIntegration.dockerConfigPathsMap.set(path.join(os.homedir(), ".docker"), "daemon.json");
	}

	constructor(context: vscode.ExtensionContext) {
		// get the icon info for the main tree item (Docker)
		this.mainTreeItemIconPath = {
			dark: path.join(Util.getResourceImagePath(), "docker_small_dark.svg"),
			light: path.join(Util.getResourceImagePath(), "docker_small_dark.svg") //TODO create the "light" icon
		};

		// create and add the "non-dynamic" docker tree items.
		this.createBaseTreeItems();

		// register the docker commands
		this.registerCommands(context);
	}

	/**
	 * Returns the image tree item ID (only docker images)
	 * @param {string} imageName  - docker image name (tags)
	 * @returns {string} - tree item ID
	 */
	private static getTreeItemImageId(imageName: string): string {
		return `${DockerIntegration.imageItemIdPrefix}.${imageName}`;
	}

	/**
	 * This function replaces the local docker images and pulls them again,
	 * preferable from Pyrsia if properly configured and if available in Pyrsia.
	 * @return {Promise<void>} void
	 */
	async replaceImagesWithPyrsia(): Promise<void> {
		// TODO This logic should check two conditions and fail if not met
		// 1) If docker is configured to use Pyrsia node
		// 2) If the node is listed as docker's proxy (registry)

		// get the local docker images
		const dockerClient = Util.getDockerClient();
		const images = await dockerClient.listImages();
		const allContainers = await dockerClient.listContainers({ "all": true });
		for (const imageInfo of images) {
			const imageName = imageInfo.RepoTags?.join();
			// no image tags? => skip it
			if (!imageName) {
				continue;
			}
			// only update the images which are available in Pyrsia
			// eslint-disable-next-line no-await-in-loop
			const transImageLog: [] = await client.getDockerTransparencyLog(imageName);
			if (transImageLog.length > 0) {
				// remove the old images first
				try {
					// get all Pyrsia images relevant containers
					const containers = allContainers.filter((container) => {
						return container.Image === imageName;
					});

					// if the image has containers go to hell (skip it and warn the user)
					if (containers.length > 0) {
						vscode.window.showErrorMessage(
							`Reloading the '${imageName}' docker image
							failed because it has container(s) attached, please remove the container(s) and try again.`,
							DockerIntegration.closeOption
						);
						continue;
					}

					// delete the image first before pulling
					dockerClient.getImage(imageInfo.Id).remove({ force: true }, (error) => {
						if (error) {
							// something went wrong, warn the user then go to the next image
							vscode.window.showErrorMessage(
								`Reloading the '${imageName}' docker image
								failed, Error: ${error}`,
								DockerIntegration.closeOption
							);
							return;
						}
						// pull the deleted image and show the progress (icons in the Integrations view)
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						dockerClient.pull(imageName, (err: string, stream: any) => {
							console.debug(err);

							// this one is executed when the pulling is done
							const onFinished = (error_: unknown, output: unknown) => {
								if (error_) {
									console.error(error_);
								}
								console.debug(output);
								// delete the tree item representing the image, it will be recreated on the next update
								this.treeItems.delete(DockerIntegration.getTreeItemImageId(imageName));
								// request the view (UI) update
								IntegrationsView.requestIntegrationsUpdate();
							};

							// this method is periodically called as the image is being pulled
							const onProgress = (event: unknown) => {
								console.debug(event);
								const treeItem = this.treeItems.get(DockerIntegration.getTreeItemImageId(imageName));
								if (treeItem) {
									treeItem.label = `Pulling '${imageName}'`;
									treeItem.iconPath = DockerImageTreeItem.iconPathPullDocker;
									treeItem.contextValue = DockerIntegration.imageUpdatingContextValue;
								}
								// request the model the view (UI) update
								this.updateModel(true);
								IntegrationsView.requestIntegrationsViewUpdate();
							};
							// request the view (UI) update
							dockerClient.modem.followProgress(stream, onFinished, onProgress);
						});
					});
				} catch (err) {
					// pulling unsuccessfully, show the error (only in the debug mode)
					Util.debugMessage(`Couldn't replace image: ${imageInfo.Labels}, error: ${err}`);
					// request the view (UI) update
					IntegrationsView.requestIntegrationsUpdate();
				}
			}
		}
	}

	getTreeItemChildren(parentId?: string | undefined): string[] {
		let children: string[] = [];
		switch (parentId) {
			case DockerIntegration.integrationId:
				children.push(DockerIntegration.configItemId, DockerIntegration.imagesItemId);
				break;
			case DockerIntegration.configItemId:
				// eslint-disable-next-line no-case-declarations
				const configItems = [... this.treeItems].map(([, value]) => {
					return value.id;
				}).filter(id => id?.includes(DockerIntegration.configFileItemIdPrefix));
				children = children.concat((configItems as string[]));
				break;
			case DockerIntegration.imagesItemId:
				// eslint-disable-next-line no-case-declarations
				const imageItems = [... this.treeItems].map(([, value]) => {
					return value.id;
				}).filter(id => id?.includes(DockerIntegration.imageItemIdPrefix));
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

	async update(event: Event): Promise<void> {
		switch (event) {
			case Event.IntegrationModelUpdate: {
				await this.updateModel(false);
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
				this.updateModel(false);
			}
		}
		IntegrationsView.requestIntegrationsViewUpdate();
	}

	private async updateModel(pullingInProgress: boolean) {
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
			dockerTreeItem.label = `${DockerIntegration.mainTreeItemName} (Pyrsia Node or Docker is unavailable)`;
			dockerTreeItem.tooltip = "Please make sure that Docker service and Pyrsia node is up and configured";
			dockerTreeItem.iconPath = DockerIntegration.warningIconPath;
			dockerTreeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
			dockerTreeItem.command = undefined;
			dockerTreeItem.contextValue = undefined;
		} else {
			// recreate the docker tree item
			this.createDockerTreeItem();

			// find the docker conf file(s) (macos, linux). TODO Windows
			for (const confPath of DockerIntegration.dockerConfigPathsMap.keys()) {
				const fileName = DockerIntegration.dockerConfigPathsMap.get(confPath);
				if (!fileName) {
					throw new Error("Configuration file name cannot be null");
				}
				Util.findFile(confPath, fileName).then((confFilePath) => {
					if (confFilePath) {
						const id = `${DockerIntegration.configFileItemIdPrefix}.${confFilePath}`;
						const label = `${confFilePath}`;
						this.treeItems.set(
							id,
							new DockerConfigTreeItem(label, id, confFilePath, vscode.TreeItemCollapsibleState.None)
						);
					} else {
						console.debug(`No configuration for 'Docker' - ${path.join(confPath, fileName)}`);
					}
				});
			}

			// get the local docker images
			const dockerClient = Util.getDockerClient();
			const images = await dockerClient.listImages();
			const currentImages: string[] = [];

			for (const image of images) {
				const imageName = image.RepoTags?.join();
				if (imageName?.startsWith("<none>")) {
					continue;
				}
				// no image tags? => skip the image
				if (!imageName) {
					continue;
				}
				const id = DockerIntegration.getTreeItemImageId(imageName);
				const imageItem = new DockerImageTreeItem(
					id,
					imageName
				);
				currentImages.push(id);
				// check if image exists in pyrsia
				// eslint-disable-next-line no-await-in-loop
				const transImageLog: [] = await client.getDockerTransparencyLog(imageName);
				imageItem.update({ pyrsia: transImageLog.length > 0 });

				// add item to the tree items map
				this.treeItems.set(id, imageItem);
			}

			// remove deleted images
			if (!pullingInProgress) {
				for (const key of this.treeItems.keys()) {
					// skip non image tree items
					if (!key.startsWith(DockerIntegration.imageItemIdPrefix)) {
						continue;
					}
					if (!currentImages.includes(key)) {
						this.treeItems.delete(key);
					}
				}
			}
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
					const host = Util.getNodeConfig().hostWithProtocol;
					// Check if the docker config has to be updated.
					let registryMirrors: string[] = dockerConfigJson[DockerIntegration.registryMirrorsName];
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
									dockerConfigJson[DockerIntegration.registryMirrorsName] = registryMirrors;
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
			DockerIntegration.reloadDockerImagesCommandId,
			async () => {
				const result = await vscode.window.showInformationMessage(
					"👋 This operation will attempt to replace the local Docker images with images hosted by Pyrsia? Would you like to continue?",
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
		const dockerTreeItem = new DockerTreeItem(DockerIntegration.integrationId, "Docker", this.mainTreeItemIconPath);
		dockerTreeItem.contextValue = DockerIntegration.integrationId;
		this.treeItems.set(DockerIntegration.integrationId, dockerTreeItem);
	}

	private createBaseTreeItems() {
		// create "Docker" tree item
		this.createDockerTreeItem();

		// create Docker "Configuration" tree item
		this.treeItems.set(
			DockerIntegration.configItemId,
			new DockerTreeItem(
				DockerIntegration.configItemId,
				DockerIntegration.configTreeItemName,
				new vscode.ThemeIcon("gear") // NOI18N
			)
		);

		// create docker "Images" tree item
		const imagesTreeItem = new DockerTreeItem(
			DockerIntegration.imagesItemId,
			DockerIntegration.imagesTreeItemName,
			new vscode.ThemeIcon("folder-library") // NOI18N
		);
		imagesTreeItem.contextValue = DockerIntegration.integrationId;
		this.treeItems.set(
			DockerIntegration.imagesItemId,
			imagesTreeItem
		);
	}
}

// Docker Tree Item which represents the Docker configuration files
class DockerConfigTreeItem extends IntegrationTreeItem {
	// icon (path)
	private static iconPath: vscode.ThemeIcon = new vscode.ThemeIcon("go-to-file"); // NOI18N

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
			title: "Open Docker Configuration File"
		};

		this.iconPath = DockerConfigTreeItem.iconPath;
		this.contextValue = DockerIntegration.configFileItemIdPrefix;
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
		console.debug("Nothing to update in Docker integration tree item");
	}
}

class DockerImageTreeItem extends IntegrationTreeItem {
	static readonly iconPathPullDocker: vscode.ThemeIcon = new vscode.ThemeIcon("sync"); // NOI18N
	private static readonly defaultIconPath: vscode.ThemeIcon = new vscode.ThemeIcon("archive"); // NOI18N
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
		this.contextValue = context.pyrsia ? DockerIntegration.imagePyrsiaContextValue : DockerIntegration.imageNotPyrsiaContextValue;
	}
}

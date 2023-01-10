import { Uri, Webview } from "vscode";
import { NodeConfig } from "../model/NodeConfig";
import path = require("path");
import * as vscode from 'vscode';
import * as DockerClient from "dockerode";

export class Util {

	private static resourcePath: string;
	// TODO Replace it with real, persistance storage
	private static config: NodeConfig = new NodeConfig();
	private static dockerClient: DockerClient;

	static init(context: vscode.ExtensionContext): void {
		Util.resourcePath = context.asAbsolutePath(path.join('resources'));
	}

	static getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
		return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
	}

	static getNodeConfig(): NodeConfig {
		return this.config; // TODO Replace it with the configuration obtained from the ide cache/storage
	}

	static getResourcePath(): string {
		return Util.resourcePath;
	}

	static getResourceImagePath(): string {
		return path.join(Util.resourcePath, "images");
	}

	/**
	 * Get Docker Client (singleton).
	 * @returns {DockerClient} DockerClient
	 */
	static getDockerClient(): DockerClient {
		if (!this.dockerClient) {
			const dockerConfig: DockerClient.DockerOptions = { socketPath: '/var/run/docker.sock' }; //TODO Should be configurable.
			this.dockerClient = new DockerClient(dockerConfig);
		}

		return this.dockerClient;
	}

	static isDebugMode() {
		return process.env.VSCODE_DEBUG_MODE === "true";
	}

	static debugMessage(message: string) {
		if (this.isDebugMode()) {
			vscode.window.showErrorMessage(message);
		}
		console.debug(message);
	}

	static sleep(milliseconds: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, milliseconds));
	}
}


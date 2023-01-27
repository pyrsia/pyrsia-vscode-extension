import path = require("path");
import * as DockerClient from "dockerode";
import * as vscode from "vscode";
import { NodeConfig } from "../api/NodeConfig";
import { readdir } from "fs/promises";

/**
 * Utility static method (don't create instances)
 */
export class Util {
	private static resourcePath: string;
	private static config: NodeConfig;
	private static dockerClient: DockerClient;

	/**
	 * It's called once to pass the init values.
	 * @param {vscode.ExtensionContext} context - extension context
	 * @returns {void}
	 */
	public static init(context: vscode.ExtensionContext): Util {
		if (this.config) {
			throw new Error("Utils class is already initialized");
		}
		// set the resource path
		Util.resourcePath = context.asAbsolutePath(path.join('resources')); // NOI18N
		// load the configuration from the context (context is used to store the node configuration - e.g URL)
		this.config = new NodeConfigImpl(context.workspaceState);

		return this;
	}

	/**
	 * Get the node configuration.
	 * @returns {NodeConfig} returns the node config
	 */
	public static getNodeConfig(): NodeConfig {
		return Util.config;
	}

	/**
	 * Returns the resource path.
	 * @returns {string} resource path folder path
	 */
	public static getResourcePath(): string {
		return Util.resourcePath;
	}

	/**
	 * Returns the image resource path folder
	 * @returns {string} image resource folder path
	 */
	public static getResourceImagePath(): string {
		return path.join(Util.resourcePath, "images"); // NOI18N
	}

	/**
	 * Returns docker client, at this point we only support '/var/run/docker.sock'.
	 * @returns {DockerClient} docker client
	 */
	public static getDockerClient(): DockerClient {
		if (!this.dockerClient) {
			//TODO The docker client should be configurable but for now we only support Docker Desktop.
			const dockerConfig: DockerClient.DockerOptions = { socketPath: '/var/run/docker.sock' }; // NOI18N
			this.dockerClient = new DockerClient(dockerConfig);
		}

		return this.dockerClient;
	}

	/**
	 * Checks if in the debug mode.
	 * @returns {boolean} Boolean true if in the debug mode
	 */
	public static isDebugMode(): boolean {
		return process.env.VSCODE_DEBUG_MODE === "true";
	}

	/**
	 * It shows an error message (IDE notification).
	 * @param {string} message  error message
	 * @returns {void}
	 */
	public static debugMessage(message: string): void {
		if (this.isDebugMode()) {
			vscode.window.showErrorMessage(message);
		}
		console.debug(message);
	}

	/**
	 * Sleeps for the given amount of time.
	 * @param {number} milliseconds sf
	 * @returns {Promise<void>} Promise
	 */
	public static sleep(milliseconds: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, milliseconds));
	}

	/**
	 * Searches for a file in the given dir recursively.
	 * @async
	 * @param {string} dir path
	 * @param {string} fileName searched filename
	 * @returns {string} file path | unknown
	 */
	public static async findFile(dir: string, fileName: string): Promise<string | undefined> {
		const dirFileNames = await readdir(dir);
		let matchedFile: string | undefined = undefined;
		for (const dirFileName of dirFileNames) {
			if (dirFileName === fileName) {
				matchedFile = path.join(dir, dirFileName);
				break;
			}
		}

		return matchedFile;
	}
}

/**
 * Private NodeConfig implementation.
 */
class NodeConfigImpl implements NodeConfig {
	// the node supported protocol
	private static readonly protocol = "http"; // NOI18N
	// default node URL
	private static readonly defaultNodeUrl = new URL("localhost:7888"); // NOI18N
	// the configuration ket, it uses to store configuration in context.workspaceState
	private static readonly nodeUrlKey: string = "PYRSIA_NODE_URL_KEY"; // NOI18N

	private nodeUrl: URL;
	private workspaceState: vscode.Memento;

	constructor(workspaceState: vscode.Memento) {
		this.workspaceState = workspaceState;
		const nodeUrl: string | undefined = workspaceState.get(NodeConfigImpl.nodeUrlKey);
		this.url = !nodeUrl ? this.defaultUrl : new URL(nodeUrl);
	}

	get defaultUrl(): URL {
		return NodeConfigImpl.defaultNodeUrl;
	}

	get hostWithProtocol(): string {
		let host = this.nodeUrl.href;
		if (!host.toLocaleLowerCase().startsWith(NodeConfigImpl.protocol)) {
			host = `${NodeConfigImpl.protocol}://${host}`;
		}

		return host;
	}

	get protocol(): string {
		return NodeConfigImpl.protocol;
	}

	get host(): string {
		return this.nodeUrl.href;
	}

	get url(): URL {
		return this.nodeUrl;
	}

	set url(nodeUrl: URL | string | undefined) {
		if (!nodeUrl) {
			console.warn(`The node config wasn't updated because the provided URL is ${nodeUrl}`); // NOI18N
			return;
		}
		if (typeof nodeUrl === "string" ) { // NOI18N
			this.nodeUrl = new URL(nodeUrl);
		} else {
			this.nodeUrl = nodeUrl || NodeConfigImpl.defaultNodeUrl;
		}
		this.workspaceState.update(NodeConfigImpl.nodeUrlKey, this.nodeUrl);
	}
}


import { URL } from "url";

export class NodeConfig {
	private static readonly defaultNodeUrl = new URL("localhost:7888");
	private nodeUrl: URL;

	constructor(nodeUrl?: URL) {
		this.nodeUrl = nodeUrl || NodeConfig.defaultNodeUrl;
	}

	public get host(): string {
		return this.nodeUrl.href;
	}

	public get url(): URL {
		return this.nodeUrl;
	}

	public set url(nodeUrl: URL | string | undefined) {
		if (typeof nodeUrl === "string" ) {
			this.nodeUrl = new URL(nodeUrl);
		} else {
			this.nodeUrl = nodeUrl || NodeConfig.defaultNodeUrl;
		}
	}
}

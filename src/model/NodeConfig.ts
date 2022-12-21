export class NodeConfig {
	private static readonly defaultHostname = "localhost";
	private static readonly defaultPort = "7888";

	private _hostname: string;
	private _port: string;

	constructor(hostname: string = NodeConfig.defaultHostname, port: string = NodeConfig.defaultPort) {
		this._hostname = hostname;
		this._port = port;
	}
	
	get hostname(): string {
		return this._hostname;
	}

	set hostname(hostname: string) {
		this._hostname = hostname;
	}

	get port(): string {
		return this._port;
	}

	set port(port: string) {
		this._port = port;
	}
}
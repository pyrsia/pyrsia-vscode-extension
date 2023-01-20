
/**
 * This interface is used to define most of the configs related to the Pyrsia node.
 * There is on implementation of this interface that can be used as example (NodeConfigImpl.ts)
 */
export interface NodeConfig {

	get defaultUrl(): URL;

	/**
	 * Getter, provides the node supported protocol (e.g http || https)
	 * @returns {string} protocol
	 */
	get protocol(): string;
	
	/**
	 * Getter, returns the host name as string (e.g 'localhost:7888').
	 * @returns {string} host 
	 */
	get host(): string;

	/**
	 * Getter, returns Pyrsia nodes's URL.
	 * @returns {URL} url
	 */
	get url(): URL;

	/**
	 * Setter, used to set node's url.
	 * @param {URL | string | undefined} url
	 */
	set url(nodeUrl: URL | string | undefined);

	/**
	 * Getter, returns the hostname but also always includes the supported protocol (e.g. http://localhost:7888)
	 */
	get hostWithProtocol(): string;
}

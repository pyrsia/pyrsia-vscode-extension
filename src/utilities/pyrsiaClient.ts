import axios from "axios";
import { Util } from "./Util";

// Methods to get various info from a Pyrsia node

type PingResponse = {
	data: string[];
};

type StatusResponse = {
	data: string[];
};

type TransparencyLogResponse = {
	data: string[];
};

/**
 * Checks if Pyrsia node is up
 * @returns {Promise<boolean>} 'true' if Pyrsia node is up
 */
export const isNodeHealthy = async (): Promise<boolean> => {
	console.debug('Check node health');
	const nodeUrl = `${Util.getNodeConfig().hostWithProtocol}/v2`; // NOI18N
	let status;
	try {
		({ status } = await axios.get<PingResponse>(
			nodeUrl,
			{
				headers: {
					accept: 'application/json' // NOI18N
				}
			}
		));
	} catch (error) {
		console.error(error);
	}

	return status === 200;
};

/**
 * Returns Pyrsia node status.
 * @returns {Promise<any>} Returns the node status
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getStatus = async (): Promise<any> => {
	console.debug('Get node status');
	const nodeUrl = `${Util.getNodeConfig().hostWithProtocol}/status`;
	let data;
	try {
		({ data } = await axios.get<StatusResponse>(
			nodeUrl,
			{
				headers: {
					accept: 'application/json'
				}
			}
		));
	} catch (error) {
		console.error(error);
	}

	return data;
};

/**
 * Returns Pyrsia Transparency Log.
 * @param {string} imageName - docker image name
 * @returns {Promise<[]>} docker transparency log
 */
export const getDockerTransparencyLog = async (imageName: string): Promise<[]> => {
	console.log(`Get docker image transparency log info for ${imageName}`);
	const nodeUrl = `${Util.getNodeConfig().hostWithProtocol}/inspect/docker`;
	let data;

	try {
		({ data } = await axios.post<TransparencyLogResponse>(
			nodeUrl,
			{
				image: imageName
			}
		));
	} catch (error) {
		throw new Error("getDockerTransparencyLog error" + error);
	}

	return (data as unknown as []);
};

/**
 * Request docker build (adds a new docker image to Pyrsia)
 * @param {string} imageName docker image name (tags)
 * @returns {Promise[]} - the build info (mostly the build ID)
 */
export const requestDockerBuild = async (imageName: string): Promise<[]> => {
	console.log(`Request build for docker image: ${imageName}`);
	const nodeUrl = `${Util.getNodeConfig().hostWithProtocol}/build/docker`;
	let data;
	try {
		({ data } = await axios.post<TransparencyLogResponse>(
			nodeUrl,
			{
				image: imageName
			}
		));
	} catch (error) {
		throw new Error("requestDockerBuild error" + error);
	}

	return (data as unknown as []);
};

/**
 * Returns number of connected peers.
 * @returns {Pyrsia<string>} number of peers
 */
export const getPeers = async (): Promise<string> => {
	console.log('Get node peers');
	const data = await getStatus();

	return data ? data.peers_count : "0";
};

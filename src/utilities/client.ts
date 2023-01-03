import axios from "axios";
import { Util } from "./util";

export const getNodeUrl = ( ): string => {
	let nodeUrl = Util.getNodeConfig().host;

	if (!nodeUrl.toLowerCase().startsWith("http")) {
		nodeUrl = `http://${nodeUrl}`;
	}

	return nodeUrl;
};

type PingResponse = {
	data: string[];
};

type StatusResponse = {
	data: string[];
};

export const isNodeHealthy = async (): Promise<boolean> => {
	console.log('Check node health');
	const nodeUrl = `${getNodeUrl()}/v2`;
	let status;
	try {
		({ status } = await axios.get<PingResponse>(
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

	return status === 200;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getStatus = async (): Promise<any> => {
	console.log('Get node status');
	const nodeUrl = `${getNodeUrl()}/status`;
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

export const getPeers = async (): Promise<string> => {
	console.log('Get node peers');
	const data = await getStatus();

	return data ? data.peers_count : "0";
};

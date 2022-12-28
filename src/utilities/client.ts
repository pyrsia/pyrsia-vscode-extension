import axios from "axios";
import { Util } from "./util";

// TODO This should be obtained from the pyrsia node config
export function getNodeUrl(): string {
  return `http://${Util.getNodeConfig().hostname}:${getNodePort()}`;
}

// TODO This should be obtained from the pyrsia node config
function getNodePort(): string {
  return Util.getNodeConfig().port;
}

type PingResponse = {
  data: string[];
};

type StatusResponse = {
  data: string[];
};

export async function isNodeHealthy(): Promise<boolean> {
  console.log('Check node health');
  const nodeUrl = `${getNodeUrl()}/v2`;
  let status;
  try {
    ({ status } = await axios.get<PingResponse>(
      nodeUrl,
      {
        headers: {
          accept: 'application/json',
        },
      },
    ));
  } catch (e) {
    console.error(e);
  }

  return status === 200;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStatus(): Promise<any> {
  console.log('Get node status');
  const nodeUrl = `${getNodeUrl()}/status`;
  let data;

  try {
    ({ data } = await axios.get<StatusResponse>(
      nodeUrl,
      {
        headers: {
          accept: 'application/json',
        },
      },
    ));
  } catch (e) {
    console.error(e);
  }

  return data;
}

export async function getPeers(): Promise<string> {
  console.log('Get node peers');
  const data = await getStatus();
 
  return data ? data.peers_count : "0";
}
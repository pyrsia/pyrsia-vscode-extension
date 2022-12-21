import * as cp from 'child_process';
import * as client from './utilities/client';

export class NodeProvider {

    nodeProcess: cp.ChildProcess;
    pid: number | undefined;

    async isNodeHealthy() : Promise<boolean> {
        return await client.isNodeHealthy();
    }

    getHostname() : string {
        return client.getNodeUrl();
    }

    async getStatus() : Promise<unknown> {
        return await client.getStatus();
    }
        
    // async start() {
        
    //     this.pid = this.nodeProcess.pid;
    //     console.log(this.pid);
    //     vscode.window.showInformationMessage('Pyrsia Node Started');
    //     if (!await client.isNodeHealth()) {
            
    //     }
    // }

    // stop() {
    //     this.nodeProcess.kill();
    //     console.log(this.pid);
    //     vscode.window.showInformationMessage('Pyrsia Node Stopped');
    // }
}
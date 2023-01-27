import * as assert from "assert";
import * as vscode from "vscode";
import { NodeConfig } from "../../api/NodeConfig";
import { Util } from "../../utilities/Util";

// TODO more tests!
suite("Pyrsia Extension Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.");

	test("Test if the extension is activated", () => {
		const extension = vscode.extensions.getExtension("undefined_publisher.pyrsia-extension");
		assert.equal(extension?.isActive, true);
	});

	test("Test NodeConfig", () => {
		const nodeConfig: NodeConfig = Util.getNodeConfig();
		// check if the config is created
		assert(nodeConfig);
		// check if has a value
		assert(nodeConfig.url);
		// set a new value
		nodeConfig.url = nodeConfig.defaultUrl;
		// check is the node url was correctly assigned
		assert.equal(nodeConfig.url, nodeConfig.defaultUrl);
		// check host
		assert.equal(nodeConfig.host, nodeConfig.defaultUrl.href);
		// check host with protocol
		assert.equal(nodeConfig.hostWithProtocol, `${nodeConfig.protocol}://${nodeConfig.defaultUrl.href}`);
	});

});

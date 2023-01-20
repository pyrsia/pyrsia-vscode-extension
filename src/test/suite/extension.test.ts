import * as assert from 'assert';
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

// TODO - Tests
suite('Pyrsia Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});

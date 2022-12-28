import * as vscode from 'vscode';

export function openFileInEditor(filePath: string) : void {

		const setting: vscode.Uri = vscode.Uri.parse(`${filePath}`);

		vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
			vscode.window.showTextDocument(a, 1, false).then(e => {
				e.edit(edit => {
					edit.insert(new vscode.Position(0, 0), "\\ TODO Pyrsia node config json");
				});
			});
		}, (error: unknown) => {
			console.error(error);
		});

}
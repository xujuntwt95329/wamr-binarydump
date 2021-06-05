// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import {validate_wasm, bytecode_to_array, writeFile} from './utils'
import WAMRBinaryDumpContentProvider from "./preview_provider";

import { Uri } from 'vscode';

async function binarydump(uri: Uri) {
    let valid = await validate_wasm(uri);
    if (!valid)
        return;

    const saveDialogOptions = {
        filters: {
            "C header file": ["h"]
        }
    }

    vscode.window
        .showInputBox({
            title: "array name",
            value: "wasm_test_file",
            placeHolder: "wasm_test_file",
        })
        .then(array_name => {
            if (array_name === undefined) {
                return;
            }

            vscode.window.showSaveDialog(saveDialogOptions)
                .then(async (to) => {
                    if (to === undefined) {
                        return;
                    }
                    await writeFile(to!, await bytecode_to_array(uri, array_name));

                    vscode.window.showInformationMessage(`Successfully saved to ${to.fsPath}`);
                })
        })
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "wamr-binarydump" is now active!');

    const provider = new WAMRBinaryDumpContentProvider();

    const registration = vscode.workspace.registerTextDocumentContentProvider(
        "wamr-binarydump-preview",
        provider
    );

    const previewCommand = vscode.commands.registerCommand(
        "wamr-binarydump.preview",
        (uri: Uri) => {
            showPreview(uri);
        }
    );

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('wamr-binarydump.dump', (uri : vscode.Uri) => {
        // The code you place here will be executed every time your command is executed

        binarydump(uri);
    });

    context.subscriptions.push(
        disposable,
        previewCommand
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function showPreview(uri: vscode.Uri): Promise<void> {
    if (uri.scheme === "wamr-binarydump-preview") {
        return;
    }

    let preview_uri = vscode.Uri.parse('wamr-binarydump-preview:' + uri.path);
    let doc = await vscode.workspace.openTextDocument(preview_uri);
    await vscode.window.showTextDocument(doc, { preview: false });
}

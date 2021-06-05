"use strict";

import {validate_wasm, bytecode_to_array} from './utils'

import { TextDocumentContentProvider, Uri, window } from "vscode";

export default class WAMRBinaryDumpContentProvider
  implements TextDocumentContentProvider {
  public async provideTextDocumentContent(
    uri: Uri
  ): Promise<string | undefined> {
    let valid = await validate_wasm(uri);
    if (!valid)
        return;

    const content = await bytecode_to_array(uri);

    return content;
  }
}
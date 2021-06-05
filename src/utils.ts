import { Uri, window } from "vscode";
import * as fs from "fs";
import WabtModule = require("wabt");

/**
 * @param uri - path to the file.
 */
export function getPhysicalPath(uri: Uri): string {
    if (uri.scheme === "wasm-preview") {
        return uri.with({ scheme: "file" }).fsPath;
    }

    return uri.fsPath;
}

export function readFile(uri: Uri): Promise<Buffer> {
    const filepath = getPhysicalPath(uri);

    return new Promise((resolve, reject) => {
        fs.readFile(filepath, { encoding: null }, (err, data: Buffer) => {
            if (err) {
                return reject(err);
            }

            resolve(data);
        });
    });
}

export function readWasm(uri: Uri): Promise<Buffer | undefined> {
    if (uri.scheme !== "wasm-preview") {
        return new Promise<undefined>((resolve, reject) => {
            resolve(undefined);
        });
    }

    return readFile(uri);
}

export function writeFile(uri: Uri, content: Buffer | string): Promise<void> {
    const filepath = getPhysicalPath(uri);

    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, content, (err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
}

const WABT_FEATURES = {
    exceptions: true,
    mutable_globals: true,
    sat_float_to_int: true,
    sign_extension: true,
    simd: true,
    threads: true,
    multi_value: true,
    tail_call: true,
    bulk_memory: true,
    reference_types: true,
    annotations: true,
    gc: true,
};

export async function validate_wasm(uri: Uri): Promise<boolean> {
    let myModule;
    let content =
        new Uint8Array(await readFile(uri));
    const wabt = await WabtModule();

    try {
        myModule = wabt.readWasm(content, {
            ...WABT_FEATURES,
            readDebugNames: true
        });
        myModule.validate();
        myModule.applyNames();
    }
    catch (err) {
        window.showErrorMessage(`Error while reading the wasm: ${err.message}`);
    }
    finally {
        if (myModule === undefined) {
            return Promise.resolve(false);
        }

        myModule.destroy();
    }

    return Promise.resolve(true);
}

function format(str: string) :string {
    if (str.length != 2) {
        return '0' + str;
    }

    return str;
}

export async function bytecode_to_array(uri: Uri, array_name = 'wasm_test_file') : Promise<string>
{
    let content = await readFile(uri);
    let array_content : string = '';
    content.forEach((byte, i) => {
        if (i % 10 == 0) {
            array_content += '\n    ';
        }
        array_content += `0x${format(byte.toString(16))}, `;
    });

    return `unsigned char __aligned(4) ${array_name}[] = {${array_content}\n}`;
}

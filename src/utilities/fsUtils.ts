import { readdir } from "fs/promises";
import * as path from "path";

export async function findByName(dir: string, fileName: string): Promise<string | undefined> {
    let matchedFile: string | undefined = undefined;

    const dirFileNames = await readdir(dir);

    for (const dirFileName of dirFileNames) {
        if (dirFileName === fileName) {
            matchedFile =  path.join(dir, dirFileName);
            break;
        }
    }

    return matchedFile;
}

export const headerExtensions = ['.hpp', '.h', '.hh', ''];
export const sourceExtensions = ['.cpp', '.c', '.cc', '.m', '.mm'];
import * as path from "path";

export function buildGlobForExtensions(extensions: string[], filenameBase?: string) {
    return `**/${filenameBase || "*"}{${extensions.join(",")}}`;
}

export function isHeaderFile(fileName: string) {
    return headerExtensions.indexOf(path.extname(fileName)) !== -1;
}

export function isSourceFile(fileName: string) {
    return sourceExtensions.indexOf(path.extname(fileName)) !== -1;
}

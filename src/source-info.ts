export const headerExtensions = ['hpp', 'h', 'hh'];
export const sourceExtensions = ['cpp', 'c', 'cc', 'm', 'mm'];

export function buildGlobForExtensions(extensions: string[], filenameBase?: string) {
    return `**/${filenameBase || "*"}.{${extensions.join(",")}}`;
}
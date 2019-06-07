import * as vscode from 'vscode';

const headerExtensions = ['hpp', 'h', 'hh'];
const sourceExtensions = ['cpp', 'c', 'cc'];

function buildGlobForExtensions(filenameBase: string, extensions: string[]) {
  return `**/${filenameBase}.{${extensions.join(",")}}`;
}

function comparePaths(path1: string, path2: string) {
  const path1_segments = path1.split('/');
  const path2_segments = path2.split('/');
  let commonPrefixLength = 0;
  for (let i = 0; i < Math.min(path1_segments.length, path2_segments.length); ++i) {
    if (path1_segments[i] === path2_segments[i]) {
      ++commonPrefixLength;
    } else {
      break;
    }
  }
  return (path1_segments.length - commonPrefixLength) +
    (path2_segments.length - commonPrefixLength);
}

export function switchBetweenHeaderAndSourceFile() {
  const textEditor = vscode.window.activeTextEditor;
  if (!textEditor) {
    return;
  }

  const filePath = textEditor.document.fileName;
  const indexOfLastSlash = filePath.lastIndexOf('/');
  const directory = filePath.substring(0, indexOfLastSlash);
  const fileName = filePath.substring(indexOfLastSlash + 1);
  const indexOfLastDot = fileName.lastIndexOf('.');
  const fileNameBase = fileName.substring(0, indexOfLastDot);
  const extension = fileName.substring(indexOfLastDot + 1);

  let glob;
  if (headerExtensions.indexOf(extension) !== -1) {
    glob = buildGlobForExtensions(fileNameBase, sourceExtensions);
  } else if (sourceExtensions.indexOf(extension) !== -1) {
    glob = buildGlobForExtensions(fileNameBase, headerExtensions);
  } else {
    return;
  }

  vscode.workspace.findFiles(glob).then((uris) => {
    let bestCandidate;
    let minimalDifference: number|undefined;

    for (const uri of uris) {
      if (uri.scheme === "file") {
        const indexOfLastSlash = uri.path.lastIndexOf('/');
        const candidateDirectory = uri.path.substring(0, indexOfLastSlash);
        const difference = comparePaths(candidateDirectory, directory);

        if (typeof minimalDifference === 'undefined' ||
          difference < minimalDifference) {
          minimalDifference = difference;
          bestCandidate = uri;
        }
      }
    }

    vscode.commands.executeCommand("vscode.open", bestCandidate);
  });
}
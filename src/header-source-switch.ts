import * as vscode from 'vscode';
import { headerExtensions, sourceExtensions, buildGlobForExtensions } from './source-info';

export function comparePaths(path1: string, path2: string) {
  const path1_segments = path1.split('/').filter((segment) => segment.length > 0);
  const path2_segments = path2.split('/').filter((segment) => segment.length > 0);
  let commonPrefixLength = 0;
  for (let i = 0; i < Math.min(path1_segments.length, path2_segments.length); ++i) {
    if (path1_segments[i] === path2_segments[i]) {
      ++commonPrefixLength;
    } else {
      break;
    }
  }
  let commonPostfixLength = 0;
  for (let i = 0; i < Math.min(path1_segments.length, path2_segments.length) - commonPrefixLength; ++i) {
    if (path1_segments[path1_segments.length - i - 1] === path2_segments[path2_segments.length - i - 1]) {
      ++commonPostfixLength;
    } else {
      break;
    }
  }

  return (path1_segments.length - commonPrefixLength - commonPostfixLength) +
    (path2_segments.length - commonPrefixLength - commonPostfixLength);
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
    glob = buildGlobForExtensions(sourceExtensions, fileNameBase);
  } else if (sourceExtensions.indexOf(extension) !== -1) {
    glob = buildGlobForExtensions(headerExtensions, fileNameBase);
  } else {
    return;
  }

  vscode.workspace.findFiles(glob).then((uris) => {
    let bestCandidate;
    let minimalDifference: number | undefined;

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
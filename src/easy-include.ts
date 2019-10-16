import { TextEditor, TextEditorEdit } from "vscode";
import * as vscode from 'vscode';
import { open, readFile, exists, readFileSync, existsSync, fstat, readdir } from "fs";
import * as path from 'path';
import * as glob from "glob";
import { buildGlobForExtensions, headerExtensions, isHeaderFile } from "./source-info";
import { getCorrespondingSourceFile } from "./header-source-switch";

export interface IncludeInsertion {
  offset: number;
  includeStatement: string;
}

const systemIncludes = [
  'cstddef',
  'limits',
  'climits',
  'contract',
  'cfloat',
  'cstdint',
  'new',
  'coroutine',
  'typeinfo',
  'exception',
  'initializer_list',
  'version',
  'csignal',
  'csetjmp',
  'cstdarg',
  'concepts',
  'stdexcept',
  'cassert',
  'cerrno',
  'system_error',
  'utility',
  'memory',
  'memory_resource',
  'scoped_allocator',
  'compare',
  'bitset',
  'tuple',
  'optional',
  'any',
  'variant',
  'type_traits',
  'ratio',
  'chrono',
  'typeindex',
  'functional',
  'ctime',
  'cstdlib',
  'string',
  'string_view',
  'cctype',
  'cwctype',
  'cwchar',
  'cuchar',
  'cstring',
  'charconv',
  'locale',
  'codecvt',
  'clocale',
  'span',
  'array',
  'vector',
  'deque',
  'forward_list',
  'list',
  'map',
  'set',
  'queue',
  'unordered_map',
  'unordered_set',
  'stack',
  'iterator',
  'ranges',
  'algorithm',
  'execution',
  'complex',
  'random',
  'valarray',
  'numeric',
  'cfenv',
  'cmath',
  'bit',
  'iosfwd',
  'ios',
  'iomanip',
  'streambuf',
  'istream',
  'ostream',
  'iostream',
  'sstream',
  'fstream',
  'syncstream',
  'cstdio',
  'cinttypes',
  'strstream',
  'regex',
  'filesystem',
  'thread',
  'atomic',
  'mutex',
  'shared_mutex',
  'condition_variable',
  'future',
  'ciso646',
  'cstdalign',
  'cstdbool',
  'ccomplex',
  'ctgmath',
  'concepts',
  'coroutine',
  'cstdlib',
  'csignal',
  'csetjmp',
  'cstdarg',
  'typeinfo',
  'typeindex',
  'type_traits',
  'bitset',
  'functional',
  'utility',
  'ctime',
  'chrono',
  'cstddef',
  'initializer_list',
  'tuple',
  'any',
  'optional',
  'variant',
  'compare',
  'version',
  'new',
  'memory',
  'scoped_allocator',
  'memory_resource',
  'climits',
  'cfloat',
  'cstdint',
  'cinttypes',
  'limits',
  'exception',
  'stdexcept',
  'cassert',
  'system_error',
  'cerrno',
  'contract',
  'cctype',
  'cwctype',
  'cstring',
  'cwchar',
  'cuchar',
  'string',
  'string_view',
  'charconv',
  'array',
  'vector',
  'deque',
  'list',
  'forward_list',
  'set',
  'map',
  'unordered_set',
  'unordered_map',
  'stack',
  'queue',
  'span',
  'iterator',
  'ranges',
  'algorithm',
  'execution',
  'cmath',
  'complex',
  'valarray',
  'random',
  'numeric',
  'ratio',
  'cfenv',
  'bit',
  'iosfwd',
  'ios',
  'istream',
  'ostream',
  'iostream',
  'fstream',
  'sstream',
  'syncstream',
  'strstream',
  'iomanip',
  'streambuf',
  'cstdio',
  'locale',
  'clocale',
  'codecvt',
  'regex',
  'atomic',
  'thread',
  'mutex',
  'shared_mutex',
  'future',
  'condition_variable',
  'filesystem',
  'cassert',
  'cctype',
  'cerrno',
  'cfenv',
  'cfloat',
  'cinttypes',
  'climits',
  'clocale',
  'cmath',
  'csetjmp',
  'csignal',
  'cstdarg',
  'cstddef',
  'cstdint',
  'cstdio',
  'cstdlib',
  'cstring',
  'ctime',
  'cuchar',
  'cwchar',
  'cwctype',
  'ccomplex',
  'complex',
  'complex',
  'ctgmath',
  'complex',
  'cmath',
  'complex',
  'cmath',
  'ciso646',
  'cstdalign',
  'cstdbool',
];

function prioritizedIncludePosition(...positions: number[]) {
  for (const position of positions) {
    if (position >= 0) {
      return position;
    }
  }
  return -1;
}

export function addInclude(
  code: string,
  includeStatement: string): IncludeInsertion {

  if (includeStatement[includeStatement.length - 1] !== '\n') {
    includeStatement += '\n';
  }

  if (code.length === 0) {
    return {
      offset: 0,
      includeStatement: includeStatement
    };
  }

  const localIncludeRegex = /[ \t]*#[ \t]*include[ \t]*\"([^<>"']+)\"[^\n]*\n/g;
  const globalIncludeRegex = /[ \t]*#[ \t]*include[ \t]*<([^<>"']+)>[^\n]*\n/g;

  let systemIncludesBegin = -1;
  let systemIncludesEnd = -1;
  let globalIncludesBegin = -1;
  let globalIncludesEnd = -1;
  let localIncludesBegin = -1;
  let localIncludesEnd = -1;

  let match;
  while (match = globalIncludeRegex.exec(code)) {
    if (systemIncludes.indexOf(match[1]) !== -1) {
      if (systemIncludesBegin < 0) {
        systemIncludesBegin = match.index;
      }
      systemIncludesEnd = match.index + match[0].length;
    } else {
      if (globalIncludesBegin < 0) {
        globalIncludesBegin = match.index;
      }
      globalIncludesEnd = match.index + match[0].length;
    }
  }
  while (match = localIncludeRegex.exec(code)) {
    if (localIncludesBegin < 0) {
      localIncludesBegin = match.index;
    }
    localIncludesEnd = match.index + match[0].length;
  }

  // Find insert offset position based on its type
  let insertOffset = -1;
  if (match = localIncludeRegex.exec(includeStatement)) {
    // Local include
    insertOffset = prioritizedIncludePosition(localIncludesEnd, globalIncludesEnd, systemIncludesEnd);
  } else if (match = globalIncludeRegex.exec(includeStatement)) {
    if (systemIncludes.indexOf(match[1]) !== -1) {
      // System include
      insertOffset = prioritizedIncludePosition(systemIncludesEnd, globalIncludesBegin, localIncludesBegin);
    } else {
      // 3rd party include
      insertOffset = prioritizedIncludePosition(globalIncludesEnd, systemIncludesEnd, localIncludesBegin);
    }
  } else {
    throw new Error("Invalid include statement.");
  }

  if (insertOffset < 0) {
    // No reference include statement is found
    // 1. Search for #pragma once
    // 2. Search for include guards
    // 3. Search for comment at the top of the file
    const pragmaOnceRegex = /[ \t]*#[ \t]*pragma[ \t]*once[^\n]*\n/g;
    const includeGuardsRegex = /[ \t]*#[ \t]*ifndef[ \t]*[^\n]*\n[ \t]*#[ \t]*define[ \t]*[^\n]*\n/g;
    const singleLineCommentsRegex = /^\s*(\/\/[^\n]*\n)+/g;
    const blockCommentRegex = /^\s*\/[*](\n|.)*?[*]\/.*\n/g;

    if (match = pragmaOnceRegex.exec(code)) {
      // Found pragma once
      insertOffset = match.index + match[0].length;
      // Add an empty line between the pragma and the include statement
      includeStatement = '\n' + includeStatement;
    } else if (match = includeGuardsRegex.exec(code)) {
      // Found include guards
      insertOffset = match.index + match[0].length;
      // Add an empty line between the copyright notice and the include statement
      includeStatement = '\n' + includeStatement;
    } else if (match = singleLineCommentsRegex.exec(code)) {
      // Found include guards
      insertOffset = match.index + match[0].length;
      // Add an empty line between the copyright notice and the include statement
      includeStatement = '\n' + includeStatement;
    } else if (match = blockCommentRegex.exec(code)) {
      // Found block copyright notice
      insertOffset = match.index + match[0].length;
      // Add an empty line between the copyright notice and the include statement
      includeStatement = '\n' + includeStatement;
    } else {
      insertOffset = 0;
    }
  }

  return {
    offset: insertOffset,
    includeStatement
  };
}

interface CompileCommand {
  directory: string;
  command: string;
  file: string;
}

interface CppProperties {
  configurations?: [{
    name?: string,
    intelliSenseMode?: string,
    includePath?: [string],
    macFrameworkPath?: [string],
    defines?: [string],
    forcedInclude?: [string],
    compilerPath?: string,
    cStandard?: string,
    cppStandard?: string,
    compileCommands?: string,
    browse?: {
      path?: [string],
      limitSymbolsToIncludedHeaders?: boolean,
      databaseFilename?: string
    }
  }];
}

export class EasyInclude {
  private _headerFilesInFolder: { [x: string]: string[] } = {};
  private _compileCommands: { [x: string]: [CompileCommand] } = {};

  private _quickPick = vscode.window.createQuickPick();
  private _currentItems: vscode.QuickPickItem[] = [];
  private _currentFileName: string = "";

  constructor() {
    this.parseAllCppProperties();
    this._quickPick.onDidAccept(this.accept, this);
    this._quickPick.matchOnDescription = false;
    this._quickPick.matchOnDetail = false;
  }

  private parseAllCppProperties() {
    if (vscode.workspace.workspaceFolders) {
      for (let folder of vscode.workspace.workspaceFolders) {
        this.parseCppPropertiesFile(folder.uri.fsPath);
      }
    }
  }

  private parseCppPropertiesFile(workspaceFolderPath: string) {
    const cppPropertiesPath = path.join(workspaceFolderPath, ".vscode", "c_cpp_properties.json");

    console.debug(`Reading ${cppPropertiesPath}`);
    readFile(cppPropertiesPath, (error, cppPropertiesData) => {
      if (error) {
        console.debug(`Cannot read ${cppPropertiesPath}`);
      } else {
        const cppProperties = JSON.parse(cppPropertiesData as unknown as string) as CppProperties | undefined;
        if (!cppProperties || !cppProperties.configurations) {
          vscode.window.showWarningMessage(`No configuration found in ${cppPropertiesPath}!`);
        } else {
          console.debug(`Interating ${cppPropertiesPath}`);
          for (const config of cppProperties.configurations) {
            if (!config.compileCommands) {
              vscode.window.showWarningMessage(`No compileCommands for configuration ${config.name} in ${cppPropertiesPath}.`)
            } else {
              const compileCommandsFilename = config.compileCommands.replace("${workspaceFolder}", workspaceFolderPath);
              this.extractCompileCommands(compileCommandsFilename);
            }
          }
        }
      }
    });
  }

  private extractCompileCommands(compileCommandsFilename: string) {
    console.debug(`Reading ${compileCommandsFilename}`);

    readFile(compileCommandsFilename, (error, compileCommandsData) => {
      console.debug(`Parsing ${compileCommandsFilename}`);
      const compileCommands = JSON.parse(compileCommandsData as unknown as string) as [CompileCommand];
      if (!compileCommands) {
        vscode.window.showErrorMessage(`Invalid compile commands ${compileCommandsFilename}!`);
      } else {
        for (const command of compileCommands) {
          const fileCommands = this._compileCommands[command.file];
          if (fileCommands) {
            fileCommands.push(command);
          } else {
            this._compileCommands[command.file] = [command];
          }
          if (this._currentFileName === command.file) {
            this.addIncludeForCompileCommand(command);
          }
        }
      }
    });
  }

  private getHeaderFilesInFolder(folderPath: string, callback: (files: string[]) => void) {
    folderPath = path.normalize(folderPath);
    const headerFilesInFolder = this._headerFilesInFolder[folderPath];
    if (headerFilesInFolder) {
      callback(headerFilesInFolder);
    } else {
      glob(path.join(folderPath, buildGlobForExtensions(headerExtensions)), (error, matches) => {
        this._headerFilesInFolder[folderPath] = matches;
        callback(matches);
      });
    }
  }

  private addIncludeForCompileCommand(command: CompileCommand) {
    const originalFileName = this._currentFileName;
    const includePathRegex = /-I([^ ]+)/g;
    let match: RegExpExecArray | null;
    while (match = includePathRegex.exec(command.command)) {
      const includePath = path.normalize(match[1]);
      this.getHeaderFilesInFolder(includePath, (files) => {
        if (this._currentFileName === originalFileName) {
          for (const file of files) {
            if (!file.startsWith(includePath)) {
              debugger;
            } else {
              this._currentItems.push({
                label: `#include <${file.substr(includePath.length + 1)}>`,
                description: file
              });
            }
          }
          this._quickPick.items = this._currentItems;
        }
      });
    }
  }

  private async addFileSpecificIncludesToQuickPick() {
    for (const include of systemIncludes) {
      this._currentItems.push({
        label: `#include <${include}>`
      });
    }
    this._quickPick.items = this._currentItems;

    let fileName = this._currentFileName;
    if (isHeaderFile(fileName)) {
      const uri = await getCorrespondingSourceFile(fileName);
      if (uri) {
        fileName = uri.fsPath;
      }
    }
    const compileCommands = this._compileCommands[fileName] || [];
    for (const command of compileCommands) {
      this.addIncludeForCompileCommand(command);
    }
  }

  private accept() {
    const textEditor = vscode.window.activeTextEditor;
    if (!textEditor) {
      return;
    }

    const selectedItems = this._quickPick.selectedItems;
    if (selectedItems.length !== 1) {
      debugger;
    }
    const value = selectedItems[0].label;
    if (value) {
      try {
        const insertion = addInclude(textEditor.document.getText(), value);
        const position = textEditor.document.positionAt(insertion.offset);
        // console.log(`Inserting ${insertion.includeStatement.replace('\n', '\\n')} at ${position.line}:${position.character}`);

        textEditor.edit((edit) => {
          edit.insert(
            position,
            insertion.includeStatement
          );
        });
        this._quickPick.hide();
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(error.message);
        } else {
          vscode.window.showErrorMessage('Unknown exception occured');
        }
      }
    }
  }

  addIncludeCommand() {
    const textEditor = vscode.window.activeTextEditor;
    if (!textEditor) {
      return;
    }

    this._currentFileName = textEditor.document.fileName;
    this._currentItems = [];
    this._quickPick.value = "";
    this.addFileSpecificIncludesToQuickPick();
    this._quickPick.show();
  }
}
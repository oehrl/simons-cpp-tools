import { TextEditor, TextEditorEdit } from "vscode";
import * as vscode from 'vscode';

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

export class EasyInclude {
  addIncludeCommand() {
    const textEditor = vscode.window.activeTextEditor;
    if (!textEditor) {
      return;
    }

    vscode.window.showInputBox({
      value: "#include <some_header.hpp>",
      valueSelection: [9, 26]
    }).then((value) => {
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
        } catch (error) {
          if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
          } else {
            vscode.window.showErrorMessage('Unknown exception occured');
          }
        }
      }
    });
  }
}
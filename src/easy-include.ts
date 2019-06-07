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

  const localIncludeRegex = /[ \t]*#[ \t]*include[ \t]*\"([\w- .]+)\"[^\n]*\n/g;
  const globalIncludeRegex = /[ \t]*#[ \t]*include[ \t]*<([\w- .]+)>[^\n]*\n/g;

  let systemInsertOffset = -1;
  let globalInsertOffset = -1;
  let localInsertOffset = -1;

  let match;
  while (match = globalIncludeRegex.exec(code)) {
    if (systemIncludes.indexOf(match[1]) !== -1) {
      systemInsertOffset = match.index + match[0].length;

      if (globalInsertOffset < 0) {
        globalInsertOffset = systemInsertOffset;
      }
      if (localInsertOffset < 0) {
        localInsertOffset = systemInsertOffset;
      }
    } else {
      globalInsertOffset = match.index + match[0].length;

      if (systemInsertOffset < 0) {
        systemInsertOffset = match.index;
      }
      if (localInsertOffset < 0) {
        localInsertOffset = globalInsertOffset;
      }
    }
  }
  while (match = localIncludeRegex.exec(code)) {
    localInsertOffset = match.index + match[0].length;

    if (systemInsertOffset < 0) {
      systemInsertOffset = match.index;
    }
    if (globalInsertOffset < 0) {
      globalInsertOffset = match.index;
    }
  }


  // Check type of include
  if (match = localIncludeRegex.exec(includeStatement)) {
    // Local include
    return {
      offset: localInsertOffset,
      includeStatement
    };
  } else if (match = globalIncludeRegex.exec(includeStatement)) {
    if (systemIncludes.indexOf(match[1]) !== -1) {
      // System include
      return {
        offset: systemInsertOffset,
        includeStatement
      };
    } else {
      // 3rd party include
      return {
        offset: globalInsertOffset,
        includeStatement
      };
    }
  } else {
    throw new Error("Invalid include statement.");
  }
}
//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { addInclude } from '../easy-include';

function include(code: string, includeStatement: string) {
  const insertion = addInclude(code, includeStatement);
  const beforeOffset = code.substr(0, insertion.offset);
  const afterOffset = code.substr(insertion.offset);
  return beforeOffset + insertion.includeStatement + afterOffset;
}

const anyIncludeStatement = "#include <some_header_file>";
const anySystemInclude = "#include <iostream>";
const anyLocalInclude = "#include \"some_local_header.hpp\"";

const anyOtherHeaderFile =
  `
#ifndef ANY_OTHER_HEADER_FILE
#define ANY_OTHER_HEADER_FILE

#include <cstdint>
#include <iostream>

#include <some_library.hpp>
#include <some_other_library.hpp>

#include "local_include.hpp"

namespace include {
  class cstdint {

  };
}

#endif
`;

const anyHeaderFileWithCopyrightStatementAndNoIncludes =
  `
// Some arbitrary copyright statement
// that can span multiple lines

#ifndef HEADER_FILE_WITH_COPYRIGHT_STATEMENT_AND_NO_INCLUDES
#define HEADER_FILE_WITH_COPYRIGHT_STATEMENT_AND_NO_INCLUDES

namespace include {
  class cstdint {

  };
}

#endif
`;


const otherHeaderFileWithCopyrightStatementAndNoIncludes =
  `
/* Some arbitrary copyright statement
 * that can span multiple lines
 */

#pragma once

namespace include {
class cstdint {
  // ...
};
}
`;

// Defines a Mocha test suite to group tests of similar kind together
suite("Easy Include", function () {

  // Add include statement to empty file adds newline
  test("Insert to empty source file", function () {
    const insertion = addInclude("", anyIncludeStatement);
    assert.equal(insertion.includeStatement, anyIncludeStatement + "\n");
    assert.equal(insertion.offset, 0);
  });
  {
    const anyHeaderFile =
      `
#pragma once

#include <cstdint>
#include <iostream>

#include <some_library.hpp>
#include <some_other_library.hpp>

#include "local_include.hpp"

namespace include {
class cstdint {

};
}
`;
    test("Insert system include", function () {
      const result = include(anyHeaderFile, anySystemInclude);
      assert.equal(result,`
#pragma once

#include <cstdint>
#include <iostream>
${anySystemInclude}

#include <some_library.hpp>
#include <some_other_library.hpp>

#include "local_include.hpp"

namespace include {
class cstdint {

};
}
`);
    });
    test("Insert 3rd party include", function () {
      const result = include(anyHeaderFile, anyIncludeStatement);
      assert.equal(result,`
#pragma once

#include <cstdint>
#include <iostream>

#include <some_library.hpp>
#include <some_other_library.hpp>
${anyIncludeStatement}

#include "local_include.hpp"

namespace include {
class cstdint {

};
}
`);
    });
    test("Insert local include", function () {
      const result = include(anyHeaderFile, anyLocalInclude);
      assert.equal(result,`
#pragma once

#include <cstdint>
#include <iostream>

#include <some_library.hpp>
#include <some_other_library.hpp>

#include "local_include.hpp"
${anyLocalInclude}

namespace include {
class cstdint {

};
}
`);
    });
  }
});
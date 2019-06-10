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

// Defines a Mocha test suite to group tests of similar kind together
suite("Easy Include", function () {

  // Add include statement to empty file adds newline
  test("Insert to empty source file", function () {
    const insertion = addInclude("", anyIncludeStatement);
    assert.equal(insertion.includeStatement, anyIncludeStatement + "\n");
    assert.equal(insertion.offset, 0);
  });
  // A normal header file
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
      assert.equal(result, `
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
      assert.equal(result, `
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
      assert.equal(result, `
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
  // An empty header file with a pragma once
  {
    const anyHeaderFile =
      `
#pragma once

namespace include {
class cstdint {

};
}
`;
    test("Insert an include into an empty header file (with pragma once)", function () {
      const result = include(anyHeaderFile, anyIncludeStatement);
      assert.equal(result, `
#pragma once

${anyIncludeStatement}

namespace include {
class cstdint {

};
}
`);
    });
  }
  // An empty header file with include guards
  {
    const anyHeaderFile =
      `
#ifndef ANY_HEADER_FILE  // Some comment
#define ANY_HEADER_FILE  // Another comment

namespace include {
class cstdint {

};
}
`;
    test("Insert an include into an empty header file (with include guards)", function () {
      const result = include(anyHeaderFile, anyIncludeStatement);
      assert.equal(result, `
#ifndef ANY_HEADER_FILE  // Some comment
#define ANY_HEADER_FILE  // Another comment

${anyIncludeStatement}

namespace include {
class cstdint {

};
}
`);
    });
  }
  // An empty header file with a copyright notice
  {
    const anyHeaderFile = `
// Some copyright notice
// That spans mutliple rows
// and is in general super awsome

// A totally unrelated comment about the namespace
namespace include {
class cstdint {

};
}
`;
    test("Insert an include into an empty header file (with copyright notice)", function () {
      const result = include(anyHeaderFile, anyIncludeStatement);
      assert.equal(result, `
// Some copyright notice
// That spans mutliple rows
// and is in general super awsome

${anyIncludeStatement}

// A totally unrelated comment about the namespace
namespace include {
class cstdint {

};
}
`);
    });
  }
  // An empty header file with another copyright notice
  {
    const anyHeaderFile = `
/* Another super awsome
 * copyright notice, but this
 * time it is a block comment!
 */

/* A totally unrelated comment about the namespace */
namespace include {
class cstdint {

};
}
`;
    test("Insert an include into an empty header file (with another copyright notice)", function () {
      const result = include(anyHeaderFile, anyIncludeStatement);
      assert.equal(result, `
/* Another super awsome
 * copyright notice, but this
 * time it is a block comment!
 */

${anyIncludeStatement}

/* A totally unrelated comment about the namespace */
namespace include {
class cstdint {

};
}
`);
    });
  }
  // Specific example from rainbow
  {
    const headerFile = `
#pragma once

#include "scene.hpp"

namespace rainbow {

class Octree {
 public:
  struct OcreeNode {
    glm::vec3
  };
  Octree(const Scene::Vertex* vertices, size_t vertex_count);

 private:
  const Scene::Vertex* vertices_;
  size_t vertex_count_;
};

}  // namespace rainbow
`;
    test("Insert include into exsample header", function () {
      const result = include(headerFile, '#include <glm/vec3.hpp>');
      assert.equal(result, `
#pragma once

#include <glm/vec3.hpp>
#include "scene.hpp"

namespace rainbow {

class Octree {
 public:
  struct OcreeNode {
    glm::vec3
  };
  Octree(const Scene::Vertex* vertices, size_t vertex_count);

 private:
  const Scene::Vertex* vertices_;
  size_t vertex_count_;
};

}  // namespace rainbow
`);
    });
  }
});
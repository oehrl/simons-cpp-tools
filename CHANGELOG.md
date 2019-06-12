# Changelog

All notable changes to the `Simon's C++ Tools` extension will be documented in this file.

## [0.0.3] - 2019-06-12

### Changed
- `Switch Header/Source`: the command now also works for Objective C/C++ source files (files having the extensions `.m` or `.mm`).
- `Switch Header/Source`: the command now also considers the common postfixes of the paths, so executing the command in source file `workspace/some_lib/src/a/b/c/d/test.cpp` will favor the header file `workspace/some_lib/include/a/b/c/d/test.hpp` over `workspace/some_other_lib/test.hpp`.

### Fixed
- `Add Include`: headers can now contain any characters except: `<`, `>`, `"` and `'`.

## [0.0.2] - 2019-06-10

### Fixed
- `Add Include`: bug that prevented headers containing a slash to be inserted

## [0.0.1] - 2019-06-07

### Added
- `cpptools.addInclude` command
- `cpptools.switchHeaderSource` command
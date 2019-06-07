# Simon's C++ Tools README

This extensions provides a small set functionality to make writing C++ in Visual Studio Code even more efficient.

## Features

### Add Include
Use the `cpptools.addInclude` command to add includes without scrolling to the top of the file. Currently the extension differentiates between includes of system headers, global includes (`#include <...>`) and local includes (`#include "..."`) and tries to sort the accordingly.

### Switch Header/Source
The `cpptools.switchHeaderSource` command replicates the functionality of the `C/C++` extension but takes into account the locality of the files. I.e., when there are multiple candidates it will open the one that is closest to the current file.

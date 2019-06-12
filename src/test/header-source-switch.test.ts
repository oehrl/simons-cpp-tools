// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { expect } from 'chai';
import { comparePaths } from '../header-source-switch';

// Defines a Mocha test suite to group tests of similar kind together
suite("Header/Source Switch", () => {

    // Defines a Mocha unit test
    test("Simple path difference", () => {
        assert.equal(
            comparePaths('workspace/include/libname/', 'workspace/src/'),
            3);
    });

    test("Path difference with sub dirs", () => {
        assert.equal(
            comparePaths('workspace/include/libname/subdir1/subdir2', 'workspace/src/subdir1/subdir2'),
            3);
    });

    test("Path with overlapping pre- and postfixes", () => {
        assert.equal(
            comparePaths('a/a/a', 'a/a'),
            1
        );
    });

    test("Example from changelog", () => {
        const source = 'workspace/some_lib/src/a/b/c/d/';
        const actualHeader = 'workspace/some_lib/include/a/b/c/d/';
        const alternativeHeader = 'workspace/some_other_lib/';
        expect(comparePaths(source, actualHeader)).to.be.lessThan(comparePaths(source, alternativeHeader));
    });
});
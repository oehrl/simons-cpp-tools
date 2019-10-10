import * as vscode from 'vscode';
import * as path from 'path';
import { exists, existsSync } from 'fs';

export class CMakeTaskProvider implements vscode.TaskProvider {
    private rakePromise: Thenable<vscode.Task[]> | undefined = undefined;

    constructor() {
        vscode.window.showWarningMessage("test");
    }

    public async provideTasks(): Promise<vscode.Task[]> {
        const tasks: vscode.Task[] = [];

        const cmakeSourceDirectory = vscode.workspace.getConfiguration("cmake").get<string>("sourceDirectory");
        if (cmakeSourceDirectory) {
            const folders = vscode.workspace.workspaceFolders;

            if (folders) {
                folders.forEach(folder => {
                    const cmakeListsPath = path.join(folder.uri.path, "CMakeLists.txt");

                    if (existsSync(cmakeListsPath)) {
                        const buildExecution = new vscode.ProcessExecution("${command:cmake.build}");
                        const buildTask = new vscode.Task(
                            { type: "cmakebuildtask" },
                            folder, "Build All",
                            "cpptools",
                            buildExecution,
                            "$msCompile");
                        buildTask.group = vscode.TaskGroup.Build;
                        tasks.push(buildTask);

                        const cleanExecution = new vscode.ProcessExecution("${command:cmake.clean}");
                        const cleanTask = new vscode.Task(
                            { type: "cmakecleantask" },
                            folder, "Clean",
                            "cpptools",
                            cleanExecution,
                            "$msCompile");
                        cleanTask.group = vscode.TaskGroup.Clean;
                        tasks.push(cleanTask);

                        const rebuildExecution = new vscode.ProcessExecution("${command:cmake.cleanRebuild}");
                        const rebuildTask = new vscode.Task(
                            { type: "cmakerebuildtask" },
                            folder, "Rebuild All",
                            "cpptools",
                            rebuildExecution,
                            "$msCompile");
                        rebuildTask.group = vscode.TaskGroup.Rebuild;
                        tasks.push(rebuildTask);

                        const testExecution = new vscode.ProcessExecution("${command:cmake.ctest}");
                        const testTask = new vscode.Task(
                            { type: "cmaketesttask" },
                            folder, "Run CTest",
                            "cpptools",
                            testExecution,
                            "$msCompile");
                        testTask.group = vscode.TaskGroup.Test;
                        tasks.push(testTask);
                    }
                });
            }
        }

        return tasks;
    }

    public resolveTask(_task: vscode.Task): vscode.Task | undefined {
        // const task = _task.definition.task;
        // // A Rake task consists of a task and an optional file as specified in RakeTaskDefinition
        // // Make sure that this looks like a Rake task by checking that there is a task.
        // if (task) {
        //     // resolveTask requires that the same definition object be used.
        //     const definition: RakeTaskDefinition = <any>_task.definition;
        //     return new vscode.Task(definition, definition.task, 'rake', new vscode.ShellExecution(`rake ${definition.task}`));
        // }
        // return undefined;
        return _task;
    }
}
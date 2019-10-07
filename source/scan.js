const path = require("path");
const fs = require("fs");
const fileExists = require("file-exists");
const directoryExists = require("directory-exists");
const pify = require("pify");

const readdir = pify(fs.readdir);
const realpath = pify(fs.realpath);

async function getProjectLinks(projectDirectory) {
    const nodeModules = path.join(projectDirectory, "./node_modules");
    const links = [];
    const dirContents = await readdir(nodeModules, { withFileTypes: true });
    const additionalScopedContents = [];
    for (const fileItem of dirContents) {
        if (/^@[a-zA-Z]/.test(fileItem.name)) {
            const additionalItems = await readdir(path.join(nodeModules, fileItem.name), { withFileTypes: true });
            additionalScopedContents.push(
                ...additionalItems.map(item => Object.assign(item, {
                    subName: path.join(fileItem.name, item.name)
                }))
            );
        }
    }
    for (const fileItem of [...dirContents, ...additionalScopedContents]) {
        const pathName = path.join(nodeModules, fileItem.subName || fileItem.name);
        if (fileItem.isSymbolicLink()) {
            const subIsProject = await isProjectRoot(pathName);
            if (subIsProject) {
                const resolvedPath = await realpath(pathName);
                const subPkgJsonPath = path.join(pathName, "./package.json");
                const pkgJson = require(subPkgJsonPath);
                links.push({
                    link: resolvedPath,
                    linkedPackage: pkgJson.name,
                    linkedPackageVersion: pkgJson.version,
                    path: pathName
                });
            } else {
                links.push({
                    linkedPackage: null,
                    path: pathName
                });
            }
        }
    }
    return links;
}

async function isProjectRoot(directory) {
    const pkjJson = await fileExists(path.join(directory, "./package.json"));
    const nodeModules = await directoryExists(path.join(directory, "./node_modules"));
    return pkjJson && nodeModules;
}

async function scanLinks(rootDirectory) {
    const isProject = await isProjectRoot(rootDirectory);
    let links = [];
    if (isProject) {
        links = await getProjectLinks(rootDirectory);
    } else {
        // Perhaps a directory containing projects
        const dirContents = await readdir(rootDirectory, { withFileTypes: true });
        for (const fileItem of dirContents) {
            if (!fileItem.isDirectory()) {
                continue;
            }
            const pathName = path.join(rootDirectory, fileItem.name);
            if (await isProjectRoot(pathName)) {
                links.push(...await getProjectLinks(pathName));
            }
        }
    }
    return links;
}

scanLinks("/Users/perry/work").then(console.log);

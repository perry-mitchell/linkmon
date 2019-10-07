const path = require("path");
const fs = require("fs");
const fileExists = require("file-exists");
const directoryExists = require("directory-exists");
const pify = require("pify");

const readdir = pify(fs.readdir);
const realpath = pify(fs.realpath);

async function getProjectLinks(projectDirectory) {
    const nodeModules = path.join(projectDirectory, "./node_modules");
    const pkgJsonPath = path.join(projectDirectory, "./package.json");
    const pkgJson = require(pkgJsonPath);
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
                const subPkgJson = require(subPkgJsonPath);
                links.push({
                    link: resolvedPath,
                    linkedPackage: subPkgJson.name,
                    linkedPackageVersion: subPkgJson.version,
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
    return links.map(link => Object.assign(link, {
        parent: pkgJson.name,
        parentVersion: pkgJson.version
    }));
}

async function isProjectRoot(directory) {
    const pkjJson = await fileExists(path.join(directory, "./package.json"));
    const nodeModules = await directoryExists(path.join(directory, "./node_modules"));
    return pkjJson && nodeModules;
}

async function scanLinks(rootDirectory) {
    const targetDirectory = path.resolve(process.cwd(), rootDirectory);
    const isProject = await isProjectRoot(targetDirectory);
    let links = [];
    if (isProject) {
        links = await getProjectLinks(targetDirectory);
    } else {
        // Perhaps a directory containing projects
        const dirContents = await readdir(targetDirectory, { withFileTypes: true });
        for (const fileItem of dirContents) {
            if (!fileItem.isDirectory()) {
                continue;
            }
            const pathName = path.join(targetDirectory, fileItem.name);
            if (await isProjectRoot(pathName)) {
                links.push(...await getProjectLinks(pathName));
            }
        }
    }
    return links;
}

module.exports = {
    scanLinks
};

const path = require("path");
const fs = require("fs");
const pify = require("pify");

const readdir = pify(fs.readdir);

function scanLinks(rootDirectory) {
    return readdir(rootDirectory, { withFileTypes: true })
        .then(links => {
            console.log(links.map(item => ({
                filename: path.join(rootDirectory, item.name),
                isSymlink: item.isSymbolicLink()
            })));
        });
}

scanLinks(path.resolve(__dirname, "../../"));

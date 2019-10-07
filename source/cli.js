#!/usr/bin/env node

const chalk = require("chalk");
const columnify = require("columnify");
const minimist = require("minimist");
const keypress = require("keypress");
const notifier = require("node-notifier");
const { scanLinks } = require("./scan.js");
const { drawMain } = require("./windows.js");

const argv = minimist(process.argv.slice(2));
const {
    _: directories = [],
    help = false,
    interval: intervalRaw = 15,
    notify = false
} = argv;

// Help
if (help) {
    console.log(`
Usage: linkmon [options] [arguments]

    Watch a directory:
        linkmon ~/programming/projects
    Watch multiple directories, with notifications:
        linkmon /Users/lucy/git ~/temp/my-project --notify
    Custom watch interval (30 seconds):
        linkmon some-dir --interval=30

Options:
    --interval=             Watch interval, in seconds, for monitoring
                            the provided project directories. Defaults
                            to 15 seconds.
    --notify                Enable operating-system notifications. Is
                            disabled by default. Requires a GUI such
                            as Mac OS or Windows.

Arguments:
    Provide one or more directories for scanning and monitoring. A
    directory can either contain one or more further directories that
    house NodeJS projects, or can be a NodeJS project itself. A
    directory is classified as a NodeJS project if it contains a
    package.json file and a node_modules directory.

For further information read the documentation on GitHub:
    https://github.com/perry-mitchell/linkmon
    `.trim());
    process.exit(0);
}

// Init
if (directories.length <= 0) {
    console.error("A scan directory must be specified");
    process.exit(2);
}
const refreshInterval = parseInt(intervalRaw, 10) * 1000;
keypress(process.stdin);
process.stdin.on("keypress", function (ch, key) {
    if (key && key.name == "q") {
        process.exit(0);
    }
});
process.stdin.setRawMode(true);
process.stdin.resume();

// Execution
let previousLinks = [];
const updateContent = drawMain();
const runUpdate = () => {
    Promise
        .all(directories.map(dir => scanLinks(dir)))
        .then(linkAgg => linkAgg.reduce((output, links) => [
            ...output,
            ...links
        ], []))
        .then(links => {
            const iterableLinks = [];
            const projectLinks = links.reduce((output, link) => {
                const { parent, parentVersion } = link;
                output[parent] = output[parent] || {
                    parent,
                    parentVersion,
                    links: []
                };
                output[parent].links.push(link);
                iterableLinks.push(link);
                return output;
            }, {});
            if (notify) {
                previousLinks.forEach(previousLink => {
                    const matching = iterableLinks.find(link => link.parent === previousLink.parent && link.linkedPackage === previousLink.linkedPackage);
                    if (!matching) {
                        notifier.notify({
                            title: `Linked module removed @ ${previousLink.parent}`,
                            message: `${previousLink.linkedPackage} (${previousLink.linkedPackageVersion}) was unlinked in ${previousLink.parent} dependencies.`
                        });
                    }
                });
            }
            previousLinks = [...iterableLinks];
            let content = "";
            Object.keys(projectLinks).forEach(projectName => {
                const item = projectLinks[projectName];
                content += `${chalk.green.bold(projectName)} ${chalk.gray(`v${item.parentVersion}`)}\n`;
                content += columnify(
                    item.links.map(linkItem => ({
                        "startPadding": " ",
                        "Project": chalk.red(linkItem.linkedPackage),
                        "Version": chalk.gray(linkItem.linkedPackageVersion),
                        "arrow": chalk.dim("⟶"),
                        "Target": chalk.yellow(linkItem.link)
                    })),
                    {
                        showHeaders: false,
                        minWidth: 4
                    }
                ) + "\n";
            });
            updateContent(content);
        })
        .catch(err => {
            updateContent(`${chalk.bold.red("Error:")} ${err.message}`);
        });
};

runUpdate();
const refreshTimer = setInterval(runUpdate, refreshInterval);

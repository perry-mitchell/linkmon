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
    interval: intervalRaw = 10000,
    notify = false
} = argv;
if (directories.length <= 0) {
    console.error("A scan directory must be specified");
    process.exit(2);
}
const refreshInterval = parseInt(intervalRaw, 10);

// Init
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

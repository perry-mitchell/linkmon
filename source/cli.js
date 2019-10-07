const chalk = require("chalk");
const columnify = require("columnify");
const { scanLinks } = require("./scan.js");
const { drawMain } = require("./windows.js");

const updateContent = drawMain();
const runUpdate = () => {
    scanLinks("")
        .then(links => {
            const projectLinks = links.reduce((output, link) => {
                const { parent, parentVersion } = link;
                output[parent] = output[parent] || {
                    parent,
                    parentVersion,
                    links: []
                };
                output[parent].links.push(link);
                return output;
            }, {});
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
// scanLinks("/Users/perry/work").then(links => updateContent(JSON.stringify(links)));

runUpdate();

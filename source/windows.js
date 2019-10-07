const blessed = require("blessed");
const chalk = require("chalk");

function drawMain() {
    const screen = blessed.screen({
        smartCSR: true
    });
    screen.title = "Link Monitor";
    const box = blessed.box({
        top: "center",
        left: "center",
        width: "100%",
        height: "100%",
        border: {
            type: "line"
        },
        content: chalk.dim.italic("Loading..."),
        style: {
            fg: "white",
            bg: "#111",
            border: {
                fg: "#555"
            }
        }
    });
    screen.append(box);
    screen.render();
    return content => {
        box.setContent(content);
        screen.render();
    };
}

module.exports = {
    drawMain
};

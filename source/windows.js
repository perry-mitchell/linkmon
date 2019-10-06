const blessed = require("blessed");
const chalk = require("chalk");
const columnify = require("columnify");

function drawMain() {
    const screen = blessed.screen({
        smartCSR: true
    });
    screen.title = "Link Monitor";
    const box = blessed.box({
        top: "center",
        left: "center",
        width: "95%",
        height: "95%",
        border: {
            type: "line"
        },
        content: `${chalk.bold("@somecompany/libraryone")}\n` + columnify([
            {
                "startPadding": " ",
                "Project": chalk.red("@child/lib"),
                "arrow": chalk.dim("⟶"),
                "Target": chalk.yellow("../child/lib")
            }
        ], {
            showHeaders: false,
            minWidth: 4
        }),
        style: {
            fg: "white",
            bg: "#111",
            border: {
                fg: "#555"
            }
        }
        // top: 'center',
        // left: 'center',
        // width: '50%',
        // height: '50%',
        // content: 'Hello {bold}world{/bold}!',
        // tags: true,
        // border: {
        //   type: 'line'
        // },
        // style: {
        //   fg: 'white',
        //   bg: 'magenta',
        //   border: {
        //     fg: '#f0f0f0'
        //   },
        //   hover: {
        //     bg: 'green'
        //   }
        // }
    });
    screen.append(box);
    screen.render();
}

drawMain();

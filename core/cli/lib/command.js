"use strict"
const pkg = require("../package.json")
const colors = require("colors/safe")

const log = require("@blink-cli/log")

// 执行命令 对应的 模块
const commands = {
    init: {
        name: "foo",
        version: "latest"
    }
}

function registerCommands() {
    const commander = require("commander")
    const program = commander.program

    program
        .name(Object.keys(pkg.bin)[0])
        .version(pkg.version)
        .usage("<command> [options]")

    // 调试模式 执行命令
    program
        .option("-d, --debug", "是否开启调试模式", false)
        .on("option:debug", () => {
            const { debug } = program.opts()
            if (debug) {
                process.env.LOG_LEVEL = "verbose"
            } else {
                process.env.LOG_LEVEL = "log"
            }
            log.level = process.env.LOG_LEVEL
        })

    // 使用指定本地模块 执行此命令
    program
        .option("-tp, --targetPath <targetPath>", "使用本地模块执行此命令", null)
        .on("option:targetPath", () => {
            const { targetPath } = program.opts()
            process.env.CLI_TARGET_PATH = targetPath
        })

    // 注册命令
    // 命令1：初始化项目
    program
        .command("init [projectName]")
        .description("初始化项目")
        .option("-f, --force", "是否强制初始化项目，直接删除同名项目", false)
        .action(function (...args) {
            const exec = require("@blink-cli/exec")
            exec(commands["init"], ...args)
        })

    // 监听所有的命令，对未知的命令进行提示
    program.on("command:*", (options) => {
        log.warn(colors.red(`未知的命令：${options[0]}`))

        // 提示可用的命令
        const availableCommands = program.commands.map(cmd => cmd.name())
        log.info(colors.green("可用命令：" + availableCommands.join(",")))
    })

    // 解析命令
    program.parse(process.argv)
}


module.exports = {
    registerCommands
}
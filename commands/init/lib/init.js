
const Command = require("@blink-cli/command")
const Package = require("@blink-cli/package")
const log = require("@blink-cli/log")
const { isCwdEmpty, spinnerStart, execCommandAsync } = require("@blink-cli/utils")
const inquirer = require("inquirer")
const fse = require("fs-extra")
const semver = require("semver")
const kebabCase = require("kebab-case")
const ejs = require("ejs")
const glob = require("glob")
const path = require("path")

const { templates, TEMPLATE_TYPE_NORMAL, TEMPLATE_TYPE_COSTUM } = require("./templates")

// 最低node版本
const LOWEST_NODE_VERSION = "12.0.0"
class InitCommand extends Command {
    constructor(...args) {
        super({
            lowestNodeVersion: LOWEST_NODE_VERSION
        }, ...args)
    }

    // 初始化
    init() {
        this.packageName = this._args[0]
        this.args = this._args[1]
    }

    // 执行命令
    async exec() {
        try {
            const prepareSuccess = await this.prepare()
            if (!prepareSuccess) {
                return false
            }

            const projectInfo = await this.getProjectInfo()
            if (!projectInfo) {
                return false
            }
            log.verbose("projectInfo", projectInfo)

            const templatePackage = await this.downloadTemplate(projectInfo)
            log.verbose("templatePackage", templatePackage)

            await this.installTemplate(projectInfo, templatePackage)
        } catch (error) {
            log.error(error.message)
        }
    }

    // 目录准备阶段
    async prepare() {
        // 判断项目地址是否为空
        const projectPath = process.cwd()
        if (!isCwdEmpty(projectPath)) {
            // 是否强制安装
            if (!this.args.force) {
                const answer = await inquirer.prompt({
                    type: "confirm",
                    name: "continue",
                    default: false,
                    message: "当前文件夹不为空，是否继续创建项目？"
                })
                if (!answer.continue) {
                    return false
                }
            }
            // 二次询问
            const answer = await inquirer.prompt({
                type: "confirm",
                name: "continue",
                default: false,
                message: "清空后不可恢复，请确认是否清空当前目录？"
            })
            if (answer.continue) {
                const spinner = spinnerStart("正在清空文件目录...")
                fse.emptyDirSync(projectPath)
                spinner.stop(true)
            } else {
                return false
            }
        }
        return true
    }

    // 获取项目的详细信息
    async getProjectInfo() {
        if (templates.length <= 0) {
            throw new Error("暂无项目模板")
        }
        const projectInfo = await inquirer.prompt([
            {
                type: "input",
                name: "name",
                message: "请输入项目名称",
                default: this.packageName || path.parse(process.cwd()).name,
                validate: function (value) {
                    const done = this.async()
                    setTimeout(() => {
                        // 验证
                        // 1，首字符必须为字母
                        // 2，尾字符必须为数字或字母
                        // 3，只能用 - 特殊字符连接
                        if (!/^[a-zA-Z]+[\w-]*[a-zA-Z0-9]$/.test(value)) {
                            done("请输入合法的项目名称")
                        }
                        done(null, true)
                    }, 0)
                }
            },
            {
                type: "input",
                name: "version",
                message: "请输入项目版本号",
                default: "1.0.0",
                validate: function (value) {
                    const done = this.async()
                    setTimeout(() => {
                        // 验证
                        if (!semver.valid(value)) {
                            done("请输入合法的版本号，如：v1.0.0")
                        }
                        done(null, true)
                    }, 0)
                    return
                },
                filter: (value) => {
                    if (semver.valid(value)) {
                        // 格式化
                        return semver.valid(value)
                    } else {
                        return value
                    }
                }
            },
            {
                type: "input",
                name: "description",
                message: "请输入项目描述",
                default: "",
                validate: function (value) {
                    const done = this.async()
                    setTimeout(() => {
                        // 验证
                        if (!value) {
                            done("请输入项目描述")
                        }
                        done(null, true)
                    }, 0)
                }
            },
            {
                type: "list",
                name: "template",
                message: "请选择项目模板",
                choices: templates.map(template => {
                    return {
                        value: template.npmName,
                        name: template.name
                    }
                }),
                filter: function (value) {
                    return templates.find(template => template.npmName === value)
                },
            }
        ])

        if (projectInfo) {
            projectInfo.name = kebabCase(projectInfo.name).replace(/^-/, "")
        }
        return projectInfo
    }

    // 下载模板
    async downloadTemplate(projectInfo) {
        const targetPath = path.resolve(process.env.USER_HOME, process.env.CLI_TEMPLATE_PATH)
        const pkg = new Package({
            targetPath: targetPath,
            packageConfig: {
                name: projectInfo.template.npmName,
                version: projectInfo.template.version
            }
        })
        if (await pkg.exists()) {
            const spinner = spinnerStart("正在更新模板...")
            try {
                await pkg.update()
            } catch (error) {
                throw new Error(error.message)
            } finally {
                spinner.stop(true)
                if (await pkg.exists()) {
                    log.success("更新模板成功！")
                }
            }
        } else {
            const spinner = spinnerStart("正在下载模板...")
            try {
                await pkg.install()
            } catch (error) {
                throw new Error(error.message)
            } finally {
                spinner.stop(true)
                if (await pkg.exists()) {
                    log.success("下载模板成功！")
                }
            }
        }

        return pkg
    }

    // 安装模板
    async installTemplate(projectInfo, templatePackage) {
        // 普通模板安装
        if (projectInfo.template.type === TEMPLATE_TYPE_NORMAL) {
            await this.installNormalTemplate(projectInfo, templatePackage)
        }
        // 自定义模板安装
        if (projectInfo.template.type === TEMPLATE_TYPE_COSTUM) {
            await this.installCustomTemplate(projectInfo, templatePackage)
        }
    }

    // 安装普通模板
    async installNormalTemplate(projectInfo, templatePackage) {
        log.verbose("普通模板安装", templatePackage)
        // 判断是否有模板存在
        const packagePath = templatePackage.cachePackagePath
        const templatePath = path.resolve(packagePath, "template")
        log.verbose("模块缓存路径", packagePath)
        log.verbose("模板路径", templatePath)
        if (!fse.existsSync(templatePath)) {
            throw new Error("模块内不存在模板目录！")
        }

        const spinner = spinnerStart("正在安装标准模板...")

        // 将文件复制到当前目录
        fse.copySync(templatePath, process.cwd())

        spinner.stop(true)

        // 对模板中的变量进行替换
        await this.renderTemplateValiable(projectInfo)

        const { installCommand, serveCommand } = projectInfo.template
        // 是否有安装命令
        if (installCommand) {
            log.notice("开始依赖安装")
            const args = installCommand.split(" ")
            const command = args[0]
            const commandArgs = args.slice(1)
            const ret = await execCommandAsync(command, commandArgs, {
                cwd: process.cwd(),
                stdio: "inherit"
            })
            if (ret !== 0) {
                throw new Error("安装依赖失败！")
            } else {
                log.success("依赖安装成功！")
            }
        } else {
            throw new Error("无依赖安装命令:installCommand")
        }

        // 是否有启动命令
        if (serveCommand) {
            log.notice("开始启动本地服务")
            const args = serveCommand.split(" ")
            const command = args[0]
            const commandArgs = args.slice(1)
            const ret = await execCommandAsync(command, commandArgs, {
                cwd: process.cwd(),
                stdio: "inherit"
            })
            if (ret !== 0) {
                throw new Error("启动本地服务失败！")
            }
        } else {
            throw new Error("无本地服务启动命令:serveCommand")
        }
    }

    // 安装自定义模板
    async installCustomTemplate(projectInfo, templatePackage) {
        log.verbose("自定义模板安装", templatePackage)
        // 查找项目中根执行文件
        const rootFile = templatePackage.getRootFilePath()
        if (!fse.existsSync(rootFile)) {
            throw new Error("没有执行文件,请检查模板模块")
        }
        const packagePath = templatePackage.cachePackagePath
        const templatePath = path.resolve(packagePath, "template")
        if (!fse.existsSync(templatePath)) {
            throw new Error("没有模板文件,请检查模板模块")
        }
        const options = {
            projectInfo,
            targetPath: process.cwd(),
            templatePath: templatePath
        }
        const code = `require('${rootFile}')(${JSON.stringify(options)})`
        try {
            await execCommandAsync("node", ["-e", code], {
                cwd: process.cwd(),
                stdio: "inherit"
            })
            log.success("自定义模板安装成功!")
        } catch (err) {
            log.verbose("自定义模板安装错误", err)
            throw new Error(err.message)
        }

    }

    async renderTemplateValiable(projectInfo) {
        const spinner = spinnerStart("正在替换模板变量...")
        const workPath = process.cwd()
        return new Promise((resolve, reject) => {
            glob("**", {
                cwd: workPath,
                ignore: ["node_modules/**", "public/**"],
                nodir: true
            }, (err, matches) => {
                if (err) {
                    spinner.stop(true)
                    log.error("替换模板变量失败！")
                    reject(err)
                }
                Promise.all(matches.map(filePath => {
                    return new Promise((resolve, reject) => {
                        const fileCurrentPath = path.resolve(workPath, filePath)
                        ejs.renderFile(fileCurrentPath, projectInfo, {}).then((renderedFile) => {
                            fse.writeFile(fileCurrentPath, renderedFile)
                            resolve(renderedFile)
                        }).catch(err => {
                            reject(err)
                        })
                    })
                })).then(() => {
                    spinner.stop(true)
                    log.success("替换模板变量成功！")
                    resolve()
                }).catch((err) => {
                    spinner.stop(true)
                    log.error("替换模板变量失败！")
                    reject(err)
                })
            })
        })
    }
}


function init(...args) {
    // 初始化
    return new InitCommand(...args)
}

module.exports = init
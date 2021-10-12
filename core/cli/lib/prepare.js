const path = require("path")
const userHome = require("user-home")
const pathExists = require("path-exists")
const semver = require("semver")
const colors = require("colors/safe")

const defaultEnv = require("./env")
const log = require("@blink-cli/log")
const pkg = require("../package.json")


// 检查脚手架版本
async function checkCliVersion() {
    const { version, name } = pkg
    log.notice("cli", version)

    // 获取脚手架最新包的信息
    const { getNpmLatestVersion } = require("@blink-cli/get-npm-info")
    try {
        const latestVersion = await getNpmLatestVersion(name, version)
        log.info(latestVersion)

        // 最新版本大于当前版本则建议更新
        if (latestVersion && semver.gt(latestVersion, version)) {
            log.warn(colors.yellow(`\n请手动更新${name}，当前版本：${version}，最新版本：${latestVersion}。\n更新命令：npm i ${name} --save`))
        }
    } catch (error) {
        log.warn("查询比较最新脚手架版本失败.")
        log.verbose(error)
    }
}

// 自动降级用户账户
function checkRootAccount() {
    // 对系统uid降级 root=>普通用户 
    const rootCheck = require("root-check")
    rootCheck()
}

// 检查用户主目录是否存在
function checkUserHomePath() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error("当前登录用户目录不存在！")
    }
}

// 配置环境变量
function checkEnv() {
    // 先将配置的默认环境变量配置到全局
    for (let envKey in defaultEnv) {
        if (!process.env[envKey]) {
            process.env[envKey] = defaultEnv[envKey]
        }
    }

    // 检查用户根目录下的环境变量文件
    const envPath = path.resolve(userHome, ".env")
    // 配置到全局环境变量
    if (pathExists(envPath)) {
        const dotEnv = require("dotenv")
        dotEnv.config({
            path: envPath
        })
    }

    // 输出配置的环境变量
    log.verbose("环境变量", process.env)
}


// 准备阶段
async function prepare() {
    await checkCliVersion()
    checkRootAccount()
    checkUserHomePath()
    checkEnv()
}

module.exports = prepare
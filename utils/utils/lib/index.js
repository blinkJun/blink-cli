
const cp = require("child_process")

const { Spinner } = require("cli-spinner")
const path = require("path")

const objectTypes = {
    obj: "[object Object]",
    array: "[object Array]",
    reg: "[object RegExp]",
    date: "[object Date]",
    set: "[object Set]",
    map: "[object Map]"
}
const getObjectType = function (target) {
    return Object.prototype.toString.call(target)
}

const isObject = function (target) {
    return objectTypes.obj === getObjectType(target)
}

/**
 * @method spinnerStart
 * @description 滚动条加载
 * @param {String} spinnerText
 * @param {String} spinnerString
 * @return {spinnerInstance}
 */
const spinnerStart = function (spinnerText = "正在加载...", spinnerString = Spinner.spinners[18]) {
    const spinnerInstance = new Spinner(`${spinnerText} %s`)
    spinnerInstance.setSpinnerString(spinnerString)
    spinnerInstance.start()
    return spinnerInstance
}

/**
 * @method execCommand
 * @description spawn win32平台兼容 命令执行
 * @param {String} command
 * @param {Array} args
 * @param {Object} options
 * @return {*} child instance
 */
const execCommand = function (command, args, options) {
    const win32 = process.platform === "win32"
    const cmd = win32 ? "cmd" : command
    const cmdArgs = win32 ? ["/c"].concat(command, args) : args

    return cp.spawn(cmd, cmdArgs, options || {})
}

/**
 * @method execCommandAsync
 * @description spawn win32平台兼容 命令执行 异步
 * @param {String} command
 * @param {Array} args
 * @param {Object} options
 * @return {Promise} child status
 */
const execCommandAsync = function (command, args, options) {
    return new Promise((resolve, reject) => {
        const child = execCommand(command, args, options)
        child.on("error", (e) => {
            reject(e)
        })
        child.on("exit", (res) => {
            resolve(res)
        })
    })
}

// 格式化macOS/window上的分隔符
function formatPath(filterPath) {
    if (filterPath && typeof filterPath === "string") {
        // 查看系统分隔符
        const sep = path.sep
        if (sep === "/") {
            return filterPath
        } else {
            return filterPath.replace(/\\/g, "/")
        }
    }
    return filterPath
}

module.exports = {
    execCommand,
    execCommandAsync,
    isObject,
    spinnerStart,
    formatPath
}
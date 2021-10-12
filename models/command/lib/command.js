const semver = require("semver")
const log = require("@blink-cli/log")
const colors = require("colors/safe")

class Command {
    constructor({lowestNodeVersion},...args){
        if(!args){
            throw new Error("参数不能为空！")
        }
        if(!Array.isArray(args)){
            throw new Error("参数不是数组！")
        }
        if(args.length===0){
            throw new Error("参数列表为空！")
        }
        this.lowestNodeVersion = lowestNodeVersion
        this._args = args.slice(0,args.length-1)
        this._cmd = args[args.length-1]

        log.verbose("args",this._args)
        log.verbose("cmd",this._cmd)
        
        this.run()
    }

    async run(){
        try {
            await Promise.resolve()
            // 检查最小node版本
            await this.checkNodeVersion()
            // 实例命令自己的初始化
            await this.init()
            // 实例命令执行
            await this.exec()
        } catch (error) {
            log.error(error.message)
        }
    }

    async checkNodeVersion(){
        const currentVersion = process.version
        if(semver.gt(this.lowestNodeVersion,currentVersion)){
            throw new Error(colors.red(`此命令需要的最低node版本为：${this.lowestNodeVersion}`))
        }
    }

    init(){
        throw new Error("init 必须实现.")
    }

    exec(){
        throw new Error("exec 必须实现.")
    }
}

module.exports = Command
"use strict"
const log = require("@blink-cli/log")
const path = require("path")
const Package = require("@blink-cli/package")
const {execCommand} = require("@blink-cli/utils")

async function exec(packageConfig,...args) {
    
    // 是否使用指定的本地模块执行此命令
    const localPath = process.env.CLI_TARGET_PATH
    
    let pkg
    if(localPath){
        pkg = new Package({
            localPath,
            packageConfig
        })
    }else{
        const targetPath = path.resolve(process.env.USER_HOME,process.env.CLI_DEPENDENCIES_PATH)
        pkg = new Package({
            targetPath,
            packageConfig
        })
        if(await pkg.exists()){
            await pkg.update()
        }else{
            await pkg.install()
        }
    }

    const rootFile = pkg.getRootFilePath()

    if(rootFile){
        log.verbose("rootFile",rootFile)
        
        // 执行命令
        try {
            // 精简参数
            const params = Object.create(null)
            const cmdOptions = args[args.length-1]
            for(let key in cmdOptions){
                if(key.startsWith("_")||key==="parent"){
                    continue
                }
                params[key] = args[key]
            }
            // 覆盖到原参数
            args[args.length-1] = params
            
            // 生成执行命令
            const code = `require('${rootFile}').apply(null,${JSON.stringify(args)})`

            log.verbose("执行命令",code)
            
            // 使用子进程执行命令
            // 开启新进程执行代码，node -e 'console.log(1)'
            const child = execCommand("node",["-e",code],{
                cwd:process.cwd(),
                stdio:"inherit"
            })

            child.on("error",(error)=>{
                log.error(error.message)
                // 退出命令执行
                process.exit(1)
            })

            child.on("exit",(e)=>{
                log.verbose(`命令执行成功：${e}`)
                // 退出命令执行
                process.exit(e)
            })

        } catch (error) {
            log.error(`命令执行失败：${error.message}`)
        }
    }
}

module.exports = exec
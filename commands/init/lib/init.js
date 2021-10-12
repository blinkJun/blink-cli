
const Command = require("@blink-cli/command")
const log = require("@blink-cli/log")
const {isCwdEmpty,spinnerStart} = require("@blink-cli/utils")
const inquirer = require("inquirer")
const fse = require("fs-extra")
const semver = require("semver")
const kebabCase = require("kebab-case")

const {templates} = require("./templates")

// 最低node版本
const LOWEST_NODE_VERSION = "12.0.0"
class InitCommand extends Command {
    constructor(...args){
        super({
            lowestNodeVersion:LOWEST_NODE_VERSION
        },...args)
    }

    // 初始化
    init(){
        this.packageName = this._args[0]
        this.args = this._args[1]
    }

    // 执行命令
    async exec(){
        try {
            const prepareSuccess = await this.prepare()
            if(prepareSuccess){
                const projectInfo = await this.getProjectInfo()
                log.verbose(JSON.stringify(projectInfo))
            }
        } catch (error) {
            log.error(error.message)
        }
    }

    // 目录准备阶段
    async prepare(){
        // 判断项目地址是否为空
        const projectPath = process.cwd()
        if(!isCwdEmpty(projectPath)){
            // 是否强制安装
            if(!this.args.force){
                const answer = await inquirer.prompt({
                    type:"confirm",
                    name:"continue",
                    default:false,
                    message:"当前文件夹不为空，是否继续创建项目？"
                })
                if(!answer.continue){
                    return false
                }
            }
            // 二次询问
            const answer = await inquirer.prompt({
                type:"confirm",
                name:"continue",
                default:false,
                message:"清空后不可恢复，请确认是否清空当前目录？"
            })
            if(answer.continue){
                const spinner = spinnerStart("正在清空文件目录...")
                fse.emptyDirSync(projectPath)
                spinner.stop(true)
            }else{
                return false
            }
        }
        return true
    }

    // 获取项目的详细信息
    async getProjectInfo(){
        if(templates.length<=0){
            throw new Error("暂无项目模板")
        }

        const projectInfo = await inquirer.prompt([
            {
                type:"input",
                name:"name",
                message:"请输入项目名称",
                default:this.packageName,
                validate:function(value){
                    const done = this.async()
                    setTimeout(()=>{
                        // 验证
                        // 1，首字符必须为字母
                        // 2，尾字符必须为数字或字母
                        // 3，只能用 - 特殊字符连接
                        if(!/^[a-zA-Z]+[\w-]*[a-zA-Z0-9]$/.test(value)){
                            done("请输入合法的项目名称")
                        }
                        done(null,true)
                    },0)
                }
            },
            {
                type:"input",
                name:"version",
                message:"请输入项目版本号",
                default:"1.0.0",
                validate:function(value){
                    const done = this.async()
                    setTimeout(()=>{
                        // 验证
                        if(!semver.valid(value)){
                            done("请输入合法的版本号，如：v1.0.0")
                        }
                        done(null,true)
                    },0)
                    return 
                },
                filter:(value)=>{
                    if(semver.valid(value)){
                        // 格式化
                        return semver.valid(value)
                    }else{
                        return value
                    }
                }
            },
            {
                type:"input",
                name:"description",
                message:"请输入项目描述",
                default:"",
                validate:function(value){
                    const done = this.async()
                    setTimeout(()=>{
                        // 验证
                        if(!value){
                            done("请输入项目描述")
                        }
                        done(null,true)
                    },0)
                }
            },
            {
                type:"list",
                name:"template",
                message:"请选择项目模板",
                choices:templates.map(template=>{
                    return {
                        value:template.npmName,
                        name:template.name
                    }
                }),
                filter:function(value){
                    return templates.find(template=>template.npmName===value)
                },
            }
        ])

        if(projectInfo){
            projectInfo.name = kebabCase(projectInfo.name).replace(/^-/,"")
        }
        return projectInfo
    }
}


function init(...args) {
    // 初始化
    return new InitCommand(...args)
}

module.exports = init
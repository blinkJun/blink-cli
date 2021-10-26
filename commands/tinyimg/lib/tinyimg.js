
const Command = require("@blink-cli/command")
const log = require("@blink-cli/log")

const https = require("https")
const path = require("path")
const fs =require("fs")

// 最低node版本
const LOWEST_NODE_VERSION = "12.0.0"
const MAX_SIZE = 5000000
const EXTS = [".jpg",".png"]
class TinyImgCommand extends Command{
    constructor(...args){
        super({
            lowestNodeVersion:LOWEST_NODE_VERSION
        },...args)
    }
    // 初始化
    init(){
        this.entryPath = this._args[0]
        this.outputPath = this._args[1]
        this.options = this._args[2]
    }
    // 执行命令
    async exec(imgEntryPath = path.resolve(process.cwd(),this.entryPath || "./"),deep=false){
        try{
            if(!fs.existsSync(imgEntryPath)){
                throw new Error(`目录不存在：${imgEntryPath}`)
            }
            // 是不是文件夹
            const stats = fs.statSync(imgEntryPath)
            if(!stats.isDirectory()){
                this.compress(stats,imgEntryPath)
            }else{
                // 当前进入深层且不需要递归压缩时停止
                if(deep&&!this.options.deep){
                    return false
                }
                fs.readdirSync(imgEntryPath).forEach(filePath=>{
                    this.exec(path.resolve(imgEntryPath,filePath),true)
                })
            }
        }catch(err){
            log.error(err.message)
        }
    }

    /**
     * @description 生成随机xff头
     * @return {string} xff header
     */
    getRandomIP() {
        return Array.from(Array(3))
            .map(() => parseInt(Math.random() * 255, 10))
            .concat([new Date().getTime() % 255])
            .join(".")
    }

    // 处理单个图片
    compress(stats,imagePath){
        if(stats.isFile()&&stats.size<MAX_SIZE&&EXTS.includes(path.extname(imagePath))){
            const requestParams = {
                method: "POST",
                hostname: "tinypng.com",
                path: "/web/shrink",
                headers: {
                    rejectUnauthorized: false,
                    "X-Forwarded-For": this.getRandomIP(),
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 "
                        + "(KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
                }
            }
            const req = https.request(requestParams, res => {
                res.on("data", buffer => {
                    const postInfo = JSON.parse(buffer.toString())
                    if (postInfo.error) {
                        log.error(`压缩失败！\n 当前文件：${imagePath} \n ${postInfo.message}`)
                    }else {
                        this.fileUpdate(imagePath, postInfo)
                    }
                })
            })
            req.write(fs.readFileSync(imagePath), "binary")
            req.on("error", e => {
                log.error(`请求错误! \n 当前文件：${imagePath} \n,${e.message}`)
            })
            req.end()
        }
    }

    fileUpdate(entryImgPath, info) {
        const options = new URL(info.output.url)
        const req = https.request(options, res => {
            let body = ""
            res.setEncoding("binary")
            res.on("data", data => (body += data))
            res.on("end", () => {
                fs.writeFile(entryImgPath, body, "binary", err => {
                    if (err) {
                        return log.error(err.message)
                    }
                    const origin = `${(info.input.size / 1024).toFixed(2)}KB`
                    const compress = `${(info.output.size / 1024).toFixed(2)}KB`
                    const percent = `${((1 - info.output.ratio) * 100).toFixed(2)}%`
                    log.success(`${entryImgPath}：${origin} => ${compress} (${percent})`)
                })
            })
        })
        req.on("error", e =>log.error(e.message))
        req.end()
    }
}

function exec(...args) {
    // 初始化
    return new TinyImgCommand(...args)
}

module.exports = exec
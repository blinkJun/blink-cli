
const path = require("path")
const pkgDir = require("pkg-dir")
const npmInstall = require("npminstall")
const fse = require("fs-extra")

const { formatPath } = require("@blink-cli/utils")
const { getDefaultRegistry, getNpmLatestVersion } = require("@blink-cli/get-npm-info")
// 模块类
class Package {
    constructor(options) {
        const {
            localPath,
            targetPath,
            packageConfig
        } = options

        this.localPath = localPath
        this.targetPath = targetPath
        this.packageConfig = packageConfig

        // package的模块名称格式化
        if(this.targetPath){
            this.cachePath = path.resolve(this.targetPath, "node_modules")
        }
        this.cachePackagePathPrefix = this.packageConfig.name.replace(/\//g, "_")
    }

    // 直接进行一些准备工作
    async prepare(){
        // 如果传入了缓存目录地址但是未创建则创建一个缓存目录
        if (this.targetPath && !fse.existsSync(this.cachePath)) {
            fse.mkdirSync(this.cachePath,{recursive:true})
        }
        // 将包的版本格式化为具体版本
        if (this.packageConfig.version === "latest") {
            this.packageConfig.version = await getNpmLatestVersion(this.packageConfig.name)
        }
    }

    // 获取缓存模块的具体路径
    get cachePackagePath() {
        const { name, version } = this.packageConfig
        return path.resolve(this.cachePath, `_${this.cachePackagePathPrefix}@${ version}@${name}`)
    }

    // 获取具体版本的缓存模块的具体路径
    currentVersionCachePackagePath(version) {
        const { name } = this.packageConfig
        return path.resolve(this.cachePath, `_${this.cachePackagePathPrefix}@${version}@${name}`)
    }

    // 是否存在此模块
    async exists() {
        await this.prepare()
        if (this.targetPath) {
            return fse.existsSync(this.cachePackagePath)
        } else {
            return fse.existsSync(this.localPath)
        }
    }

    // 安装此模块
    async install() {
        await this.prepare()
        // 只会将模块安装到缓存目录
        return npmInstall({
            root:  this.targetPath,
            storeDir: this.cachePath ,
            registry: getDefaultRegistry(),
            pkgs: [
                {
                    name: this.packageConfig.name,
                    version: this.packageConfig.version
                }
            ]
        })
    }

    // 更新此模块
    async update() {
        await this.prepare()
        // 获取此模块最新版本号
        const latestVersion = await getNpmLatestVersion(this.packageConfig.name)
        // 是否已经安装此包
        if (!fse.existsSync(this.currentVersionCachePackagePath(latestVersion))) {
            return npmInstall({
                root: this.targetPath,
                storeDir: this.cachePath,
                registry: getDefaultRegistry(),
                pkgs: [
                    {
                        name: this.packageConfig.name,
                        version: latestVersion
                    }
                ]
            })
        }
    }

    // 获取执行文件具体路径
    getRootFilePath() {
        const packagePath = this.localPath || this.cachePackagePath
        // 获取 package 的执行文件
        const dir = pkgDir.sync(packagePath)
        if (dir) {
            // 读取 package.json
            const pkgFile = require(path.resolve(dir, "package.json"))
            // 读取配置的执行文件
            if (pkgFile && pkgFile.main) {
                // 路径兼容
                return formatPath(path.resolve(dir, pkgFile.main))
            }
        }
        return null
    }
}


module.exports = Package

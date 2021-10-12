
const path = require('path')
const pkgDir = require('pkg-dir')
const pathExists = require('path-exists')
const npmInstall = require('npminstall')
const fse = require('fs-extra')

const { formatPath } = require('@blink-cli/utils')
const { getDefaultRegistry, getNpmLatestVersion } = require('@blink-cli/get-npm-info')
// 模块类
class Package {
    constructor(options) {
        const {
            localPath,
            storePath,
            packageConfig
        } = options

        this.localPath = localPath
        this.storePath = storePath
        this.packageConfig = packageConfig

        // package的模块名称格式化
        if(this.storePath){
            this.cachePath = path.resolve(this.storePath, 'node_modules')
        }
        this.cachePackagePathPrefix = this.packageConfig.name.replace(/\//g, '_')

        this.prepare()
    }

    // 直接进行一些准备工作
    async prepare(){
        // 如果传入了缓存目录地址但是未创建则创建一个缓存目录
        if (this.storePath && !pathExists(this.storePath)) {
            fse.mkdirSync(this.storePath)
        }
        // 将包的版本格式化为具体版本
        if (this.packageConfig.version === 'latest') {
            this.packageConfig.version = await getNpmLatestVersion(this.packageConfig.name)
        }
    }

    // 获取缓存模块的具体路径
    get cachePackagePath() {
        const { name, version } = this.packageConfig
        return path.resolve(this.cachePath, `_${this.cachePackagePathPrefix}@${name}@${version}`)
    }

    // 获取具体版本的缓存模块的具体路径
    currentVersionCachePackagePath(version) {
        const { name } = this.packageConfig
        return path.resolve(this.cachePath, `_${this.cachePackagePathPrefix}@${name}@${version}`)
    }

    // 是否存在此模块
    exists() {
        if (this.storePath) {
            return pathExists(this.cachePackagePath)
        } else {
            return pathExists(this.localPath)
        }
    }

    // 安装此模块
    async install() {
        // 只会将模块安装到缓存目录
        return npmInstall({
            root: this.cachePath,
            storeDir: this.storePath,
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
        // 获取此模块最新版本号
        const latestVersion = await getNpmLatestVersion(this.packageConfig.name)
        // 是否已经安装此包
        if (!pathExists(this.currentVersionCachePackagePath(latestVersion))) {
            return npmInstall({
                root: this.cachePath,
                storeDir: this.storePath,
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
            const pkgFile = require(path.resolve(dir, 'package.json'))
            // 读取配置的执行文件
            if (pkgFile && pkgFile.main) {
                // 路径兼容
                return formatPath(path.resolve(dir, pkgFile.main))
            }
        }
        return null
    }
}


module.exports = Package;

#!/usr/bin/env node
// 告诉环境变量使用node环境执行此文件

const importLocal = require("import-local")
const log = require("npmlog")

// 是否安装了本地包，有则使用本地版本
if(importLocal(__filename)){
    log.info("blink-cli：","正在使用 blin-cli 本地版本")
}else{
    require("../lib/cli")(process.argv.slice(2))
}
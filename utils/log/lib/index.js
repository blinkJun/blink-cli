'use strict';

const log = require('npmlog')

// 自定义
// 定义log的级别，只在特定的级别下打印内容
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL:'info';
// 输出前缀
log.heading = 'blink-cli'
// 前缀样式
log.headingStyle = {
    fg:'white'
}
// 添加自定义输出操作
log.addLevel('success',2000,{fg:'green',bold:true})


module.exports = log;

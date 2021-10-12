## 脚手架管理项目

### 创建新模块
使用 `lerna create cli core`，`cli`为新模块名称，`core`为放置在指定文件夹下
- 记得将`"publishConfig": { "access": "public" },` 添加到模块的`package.json`文件中，作为公开模块发布
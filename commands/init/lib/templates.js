const TEMPLATE_TYPE_NORMAL = "normal"
const TEMPLATE_TYPE_COSTUM = "custom"



const templates = [
    {
        name: "标准vue3后台管理模板",
        npmName: "@blink-cli/template-admin",
        version: "latest",
        type: TEMPLATE_TYPE_COSTUM,
        installCommand: "npm install --registry=http://registry.npm.taobao.org/",
        serveCommand: "npm run dev"
    },
    {
        name: "大也-大屏模板",
        npmName: "@blink-daye/template-screen",
        version: "latest",
        type: TEMPLATE_TYPE_COSTUM,
        installCommand: "npm install --registry=http://registry.npm.taobao.org/",
        serveCommand: "npm run serve"
    },
    {
        name: "大也-后台模板",
        npmName: "@blink-daye/template-console",
        version: "latest",
        type: TEMPLATE_TYPE_COSTUM,
        installCommand: "npm install --registry=http://registry.npm.taobao.org/",
        serveCommand: "npm run serve"
    },
    {
        name: "大也-移动端模板",
        npmName: "@blink-daye/template-mobile",
        version: "latest",
        type: TEMPLATE_TYPE_COSTUM,
        installCommand: "npm install --registry=http://registry.npm.taobao.org/",
        serveCommand: "npm run start"
    }
]

module.exports = {
    TEMPLATE_TYPE_NORMAL,
    TEMPLATE_TYPE_COSTUM,
    templates
}

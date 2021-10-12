const TEMPLATE_TYPE_NORMAL = "normal"
const TEMPLATE_TYPE_COSTUM = "custom"

const normalTemplates = [
    {
        name:"标准vue3后台管理模板",
        npmName:"@blink-cli-dev/template-hawk-admin",
        version:"latest",
        type:TEMPLATE_TYPE_COSTUM,
        installCommand:"npm install --registry=http://registry.npm.taobao.org/",
        serveCommand:"npm run dev"
    }
]

const customTemplates = [

]

const templates = [
    ...normalTemplates,
    ...customTemplates
]

module.exports = {
    TEMPLATE_TYPE_NORMAL,
    TEMPLATE_TYPE_COSTUM,
    normalTemplates,
    customTemplates,
    templates
}

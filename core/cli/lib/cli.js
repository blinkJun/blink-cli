const log = require("@blink-cli/log")

const prepare = require("./prepare")
const {registerCommands} = require("./command")

async function cli() {
    try {
        await prepare()
        registerCommands()
    } catch (error) {
        log.verbose(error)
        log.error(error.message)
    }
}





module.exports = cli
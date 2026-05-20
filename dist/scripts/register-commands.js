"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_js_1 = require("../config/config.js");
const commandHandler_js_1 = require("../handlers/commandHandler.js");
const logger_js_1 = require("../utils/logger.js");
async function main() {
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_js_1.config.token);
    const body = (0, commandHandler_js_1.getCommandJSON)();
    if (config_js_1.config.guildId) {
        logger_js_1.logger.info(`Registering ${body.length} guild commands for ${config_js_1.config.guildId}…`);
        await rest.put(discord_js_1.Routes.applicationGuildCommands(config_js_1.config.clientId, config_js_1.config.guildId), { body });
        logger_js_1.logger.info('Guild commands registered.');
    }
    else {
        logger_js_1.logger.info(`Registering ${body.length} global commands…`);
        await rest.put(discord_js_1.Routes.applicationCommands(config_js_1.config.clientId), { body });
        logger_js_1.logger.info('Global commands registered (may take up to an hour to propagate).');
    }
}
main().catch((err) => {
    logger_js_1.logger.error('Command registration failed', err);
    process.exit(1);
});
//# sourceMappingURL=register-commands.js.map
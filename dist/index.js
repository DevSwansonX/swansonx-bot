"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_js_1 = require("./config/config.js");
const commandHandler_js_1 = require("./handlers/commandHandler.js");
const eventHandler_js_1 = require("./handlers/eventHandler.js");
const logger_js_1 = require("./utils/logger.js");
async function main() {
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMembers,
            discord_js_1.GatewayIntentBits.GuildMessages,
        ],
        partials: [discord_js_1.Partials.Channel],
    });
    (0, commandHandler_js_1.loadCommands)(client);
    (0, eventHandler_js_1.loadEvents)(client);
    process.on('unhandledRejection', (err) => logger_js_1.logger.error('Unhandled rejection', err));
    process.on('uncaughtException', (err) => logger_js_1.logger.error('Uncaught exception', err));
    const shutdown = (signal) => {
        logger_js_1.logger.info(`Received ${signal} — shutting down`);
        client.destroy().finally(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    logger_js_1.logger.info(`Starting SwansonX in ${config_js_1.config.env} mode`);
    await client.login(config_js_1.config.token);
}
main().catch((err) => {
    logger_js_1.logger.error('Fatal startup error', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
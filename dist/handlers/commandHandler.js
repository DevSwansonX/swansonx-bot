"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommands = loadCommands;
exports.getCommandJSON = getCommandJSON;
const discord_js_1 = require("discord.js");
const ping_js_1 = require("../commands/ping.js");
const setup_ai_js_1 = require("../commands/setup-ai.js");
const logger_js_1 = require("../utils/logger.js");
const ALL_COMMANDS = [ping_js_1.pingCommand, setup_ai_js_1.setupAiCommand];
function loadCommands(client) {
    const collection = new discord_js_1.Collection();
    for (const cmd of ALL_COMMANDS) {
        collection.set(cmd.data.name, cmd);
        logger_js_1.logger.debug(`Loaded command: /${cmd.data.name}`);
    }
    client.commands = collection;
    logger_js_1.logger.info(`Registered ${collection.size} commands in-process`);
    return collection;
}
function getCommandJSON() {
    return ALL_COMMANDS.map((c) => c.data.toJSON());
}
//# sourceMappingURL=commandHandler.js.map
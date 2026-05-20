"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readyEvent = void 0;
const discord_js_1 = require("discord.js");
const logger_js_1 = require("../utils/logger.js");
exports.readyEvent = {
    name: discord_js_1.Events.ClientReady,
    once: true,
    execute(client) {
        logger_js_1.logger.info(`SwansonX online as ${client.user.tag} — serving ${client.guilds.cache.size} guild(s)`);
    },
};
//# sourceMappingURL=ready.js.map
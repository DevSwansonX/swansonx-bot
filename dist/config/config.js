"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
function required(name) {
    const value = process.env[name];
    if (!value || value.trim() === '') {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}
function optional(name, fallback = '') {
    return process.env[name]?.trim() || fallback;
}
exports.config = {
    token: required('DISCORD_TOKEN'),
    clientId: required('DISCORD_CLIENT_ID'),
    guildId: optional('DISCORD_GUILD_ID'),
    ownerId: optional('OWNER_ID'),
    env: optional('NODE_ENV', 'development'),
    logLevel: optional('LOG_LEVEL', 'info'),
};
//# sourceMappingURL=config.js.map
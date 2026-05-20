"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactionCreateEvent = void 0;
const discord_js_1 = require("discord.js");
const embeds_js_1 = require("../utils/embeds.js");
const logger_js_1 = require("../utils/logger.js");
exports.interactionCreateEvent = {
    name: discord_js_1.Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand())
            return;
        const client = interaction.client;
        const command = client.commands?.get(interaction.commandName);
        if (!command) {
            logger_js_1.logger.warn(`Unknown command invoked: ${interaction.commandName}`);
            return;
        }
        try {
            await command.execute(interaction);
        }
        catch (err) {
            logger_js_1.logger.error(`Command /${interaction.commandName} threw`, err);
            const payload = {
                embeds: [(0, embeds_js_1.errorEmbed)('Something went wrong', 'The command failed. Check bot logs for details.')],
                flags: discord_js_1.MessageFlags.Ephemeral,
            };
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(payload).catch(() => undefined);
            }
            else {
                await interaction.reply(payload).catch(() => undefined);
            }
        }
    },
};
//# sourceMappingURL=interactionCreate.js.map
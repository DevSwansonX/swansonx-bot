"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingCommand = void 0;
const discord_js_1 = require("discord.js");
exports.pingCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName('ping').setDescription('Health check.'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging…', fetchReply: true, withResponse: false });
        const rtt = sent.createdTimestamp - interaction.createdTimestamp;
        await interaction.editReply(`🏓 Pong — RTT ${rtt}ms · WS ${interaction.client.ws.ping}ms`);
    },
};
//# sourceMappingURL=ping.js.map
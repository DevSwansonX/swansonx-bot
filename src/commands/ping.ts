import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/template.js';

export const pingCommand: BotCommand = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Health check.'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging…', fetchReply: true, withResponse: false });
    const rtt = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`🏓 Pong — RTT ${rtt}ms · WS ${interaction.client.ws.ping}ms`);
  },
};

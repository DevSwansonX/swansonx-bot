import { Events, MessageFlags, type Interaction, type InteractionReplyOptions } from 'discord.js';
import type { BotEvent } from '../types/template.js';
import type { CommandCollection } from '../handlers/commandHandler.js';
import { errorEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

export const interactionCreateEvent: BotEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client as typeof interaction.client & { commands?: CommandCollection };
    const command = client.commands?.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command invoked: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error(`Command /${interaction.commandName} threw`, err);
      const payload: InteractionReplyOptions = {
        embeds: [errorEmbed('Something went wrong', 'The command failed. Check bot logs for details.')],
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => undefined);
      } else {
        await interaction.reply(payload).catch(() => undefined);
      }
    }
  },
};

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { BotCommand, ServerTemplate } from '../types/template.js';
import { templateService } from '../services/templateService.js';
import { GuildBuilder } from '../services/guildBuilder.js';
import { errorEmbed, infoEmbed, successEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

const CONFIRM_TIMEOUT_MS = 60_000;

export const setupAiCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('setup-ai')
    .setDescription('Spin up a full server (roles, categories, channels, onboarding) from a template.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString())
    .setDMPermission(false)
    .addStringOption((opt) =>
      opt
        .setName('template')
        .setDescription('Which preset to use.')
        .setRequired(true)
        .addChoices(
          { name: 'Minecraft community', value: 'minecraft' },
          { name: 'AI community', value: 'ai-community' },
          { name: 'Startup HQ', value: 'startup' },
          { name: 'AI-generated (from answers)', value: 'ai' },
        ),
    )
    .addStringOption((opt) =>
      opt.setName('topic').setDescription('Topic / niche (used when template=ai).').setRequired(false),
    )
    .addStringOption((opt) =>
      opt.setName('audience').setDescription('Who is this for? (used when template=ai)').setRequired(false),
    )
    .addStringOption((opt) =>
      opt.setName('vibe').setDescription('Tone / vibe (used when template=ai).').setRequired(false),
    )
    .addBooleanOption((opt) =>
      opt
        .setName('rename_server')
        .setDescription('Also rename the server to match the template (default false).')
        .setRequired(false),
    )
    .addBooleanOption((opt) =>
      opt
        .setName('skip_existing')
        .setDescription('Skip channels/roles that already exist (default true).')
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        embeds: [errorEmbed('Guild only', 'This command must be run in a server.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const templateId = interaction.options.getString('template', true);
    const topic = interaction.options.getString('topic') ?? '';
    const audience = interaction.options.getString('audience') ?? '';
    const vibe = interaction.options.getString('vibe') ?? '';
    const renameServer = interaction.options.getBoolean('rename_server') ?? false;
    const skipExisting = interaction.options.getBoolean('skip_existing') ?? true;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let template: ServerTemplate | undefined;
    if (templateId === 'ai') {
      if (!topic) {
        await interaction.editReply({
          embeds: [errorEmbed('Missing topic', 'When using `template:ai`, provide a `topic` option.')],
        });
        return;
      }
      template = await templateService.generateFromAnswers({ topic, audience, vibe });
    } else {
      template = templateService.get(templateId);
    }

    if (!template) {
      await interaction.editReply({
        embeds: [errorEmbed('Unknown template', `No template registered for "${templateId}".`)],
      });
      return;
    }

    const preview = infoEmbed(
      `Preview: ${template.name}`,
      `${template.description}\n\n` +
        `**Roles:** ${template.roles.length}\n` +
        `**Categories:** ${template.categories.length}\n` +
        `**Channels:** ${template.categories.reduce((n, c) => n + c.channels.length, 0)}\n` +
        `**Onboarding:** ${template.onboarding ? 'yes' : 'no'}\n\n` +
        `React with **Confirm** within ${CONFIRM_TIMEOUT_MS / 1000}s to build.`,
    );

    const jsonAttachment = new AttachmentBuilder(Buffer.from(JSON.stringify(template, null, 2), 'utf8'), {
      name: `${template.id}.template.json`,
    });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('setup-ai:confirm').setLabel('Confirm & Build').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('setup-ai:cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    );

    const message = await interaction.editReply({ embeds: [preview], files: [jsonAttachment], components: [buttons] });

    let press: ButtonInteraction;
    try {
      press = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: CONFIRM_TIMEOUT_MS,
      });
    } catch {
      await interaction.editReply({
        embeds: [errorEmbed('Timed out', 'No confirmation received. Re-run /setup-ai to try again.')],
        components: [],
      });
      return;
    }

    if (press.customId === 'setup-ai:cancel') {
      await press.update({
        embeds: [infoEmbed('Cancelled', 'No changes were made.')],
        components: [],
        files: [],
      });
      return;
    }

    await press.update({
      embeds: [infoEmbed('Building…', `Provisioning **${template.name}**. This can take a minute on busy servers.`)],
      components: [],
      files: [],
    });

    const builder = new GuildBuilder(interaction.guild);
    const report = await builder.build(template, { applyServerName: renameServer, skipExisting });

    logger.info('Build report', report);

    const summary =
      `**Roles created:** ${report.rolesCreated.length} (${report.rolesSkipped.length} skipped)\n` +
      `**Categories created:** ${report.categoriesCreated.length}\n` +
      `**Channels created:** ${report.channelsCreated.length}\n` +
      `**Errors:** ${report.errors.length}`;

    if (report.errors.length > 0) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            `Built with ${report.errors.length} error(s)`,
            `${summary}\n\n**First errors:**\n${report.errors.slice(0, 5).map((e) => `• ${e}`).join('\n')}`,
          ),
        ],
      });
    } else {
      await interaction.editReply({
        embeds: [successEmbed(`Server "${template.name}" provisioned`, summary)],
      });
    }
  },
};

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { BotCommand } from '../types/template.js';
import { CleanupService } from '../services/cleanupService.js';
import type { CleanupIssue, CleanupReport, CleanupSeverity } from '../types/cleanup.js';
import {
  brandEmbed,
  errorEmbed,
  infoEmbed,
  progressEmbed,
  successEmbed,
  warningEmbed,
} from '../utils/embeds.js';
import { BRAND } from '../utils/branding.js';
import { logger } from '../utils/logger.js';

const CONFIRM_TIMEOUT_MS = 90_000;

const SEVERITY_EMOJI: Record<CleanupSeverity, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  critical: '☢️',
};

export const serverCleanCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('server-clean')
    .setDescription('Analyze and optimize the server. AI-powered cleanup engine.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
    .setDMPermission(false)
    .addBooleanOption((opt) =>
      opt
        .setName('dry_run')
        .setDescription('Preview only — never modify anything. Default true.')
        .setRequired(false),
    )
    .addIntegerOption((opt) =>
      opt
        .setName('dead_days')
        .setDescription('Days inactive before a channel counts as dead. Default 30.')
        .setMinValue(1)
        .setMaxValue(365)
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

    const dryRun = interaction.options.getBoolean('dry_run') ?? true;
    const deadDays = interaction.options.getInteger('dead_days') ?? 30;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await interaction.editReply({
      embeds: [
        progressEmbed(
          'Scanning…',
          `Analyzing **${interaction.guild.name}** for issues. Scanning channels, roles, messages, permissions.`,
        ),
      ],
    });

    const service = new CleanupService(interaction.guild);
    const report = await service.analyze({ deadChannelDays: deadDays });

    if (report.issues.length === 0) {
      await interaction.editReply({
        embeds: [
          successEmbed(
            'No issues found',
            `Scanned ${report.totals.channels} channels, ${report.totals.roles} roles, ${report.totals.categories} categories. ${BRAND.emoji.spark} Server looks clean.`,
          ),
        ],
      });
      return;
    }

    const summary = renderSummary(report);
    const attachment = new AttachmentBuilder(
      Buffer.from(JSON.stringify(report, null, 2), 'utf8'),
      { name: `cleanup-${report.guildId}.json` },
    );

    const components = dryRun
      ? []
      : [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('server-clean:apply-safe')
              .setLabel('Auto-clean (safe)')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('server-clean:apply-archive')
              .setLabel('Archive dead channels')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('server-clean:cancel')
              .setLabel('Cancel')
              .setStyle(ButtonStyle.Secondary),
          ),
        ];

    const message = await interaction.editReply({
      embeds: [summary],
      components,
      files: [attachment],
    });

    if (dryRun) return;

    const press = await message
      .awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: CONFIRM_TIMEOUT_MS,
      })
      .catch(() => null);

    if (!press) {
      await interaction.editReply({
        embeds: [warningEmbed('Timed out', 'No action taken.')],
        components: [],
      });
      return;
    }

    if (press.customId === 'server-clean:cancel') {
      await press.update({
        embeds: [infoEmbed('Cancelled', 'No changes were made.')],
        components: [],
        files: [],
      });
      return;
    }

    await press.update({
      embeds: [progressEmbed('Applying cleanup…', 'Working through the issue list.')],
      components: [],
      files: [],
    });

    const applyReport = await service.apply(report, {
      dryRun: false,
      archiveOnly: press.customId === 'server-clean:apply-archive',
      kinds:
        press.customId === 'server-clean:apply-archive'
          ? ['dead-channel', 'empty-channel']
          : ['unused-role', 'bad-naming', 'dead-channel', 'empty-channel'],
    });

    logger.info('Cleanup apply report', applyReport);

    const lines = [
      `**Archived/cleaned channels:** ${applyReport.archivedChannels.length}`,
      `**Renamed channels:** ${applyReport.renamedChannels.length}`,
      `**Deleted roles:** ${applyReport.deletedRoles.length}`,
      `**Errors:** ${applyReport.errors.length}`,
    ];

    if (applyReport.errors.length > 0) {
      lines.push('', '**First errors:**');
      lines.push(...applyReport.errors.slice(0, 5).map((e) => `• ${e}`));
    }

    await interaction.editReply({
      embeds: [
        applyReport.errors.length > 0
          ? warningEmbed('Cleanup completed with warnings', lines.join('\n'))
          : successEmbed('Cleanup complete', lines.join('\n')),
      ],
    });
  },
};

function renderSummary(report: CleanupReport) {
  const byKind = report.issues.reduce<Record<string, CleanupIssue[]>>((acc, issue) => {
    (acc[issue.kind] ??= []).push(issue);
    return acc;
  }, {});

  const top = report.issues.slice(0, 15);

  const lines: string[] = [
    `**${report.guildName}** — scanned ${report.totals.channels} channels, ${report.totals.roles} roles, ${report.totals.categories} categories.`,
    '',
    `Found **${report.issues.length}** issues across **${Object.keys(byKind).length}** categories.`,
    '',
    '**Top findings**',
    ...top.map(
      (i) =>
        `${SEVERITY_EMOJI[i.severity]} \`${i.kind}\` — ${i.targetName ?? ''} · ${i.description}`,
    ),
  ];

  if (report.issues.length > top.length) {
    lines.push('', `…and ${report.issues.length - top.length} more (see attached JSON).`);
  }

  return brandEmbed('Cleanup Report', lines.join('\n'));
}

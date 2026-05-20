import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { BotCommand } from '../types/template.js';
import { WipeService } from '../services/wipeService.js';
import { BackupService } from '../services/backupService.js';
import {
  brandEmbed,
  dangerEmbed,
  errorEmbed,
  infoEmbed,
  progressEmbed,
  successEmbed,
  warningEmbed,
} from '../utils/embeds.js';
import { BRAND } from '../utils/branding.js';
import { logger } from '../utils/logger.js';

const CONFIRM_PHRASE = 'WIPE SERVER';
const TIMEOUT_MS = 120_000;

export const serverWipeCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('server-wipe')
    .setDescription('☢️ DANGER · Wipe and rebuild the server. Owner-only.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
    .setDMPermission(false)
    .addBooleanOption((opt) =>
      opt
        .setName('dry_run')
        .setDescription('Show the wipe plan and exit. Default true.')
        .setRequired(false),
    )
    .addBooleanOption((opt) =>
      opt
        .setName('rebuild_starter')
        .setDescription('After wipe, lay down the minimal starter structure. Default true.')
        .setRequired(false),
    )
    .addStringOption((opt) =>
      opt
        .setName('protect_channels')
        .setDescription('Comma-separated channel names to keep.')
        .setRequired(false),
    )
    .addStringOption((opt) =>
      opt
        .setName('protect_roles')
        .setDescription('Comma-separated role names to keep.')
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

    // Owner-only enforcement (guild owner; ManageGuild already required via slash perms)
    if (interaction.user.id !== interaction.guild.ownerId) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            'Owner only',
            'Only the **server owner** may run `/server-wipe`. This safeguard cannot be overridden.',
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const dryRun = interaction.options.getBoolean('dry_run') ?? true;
    const rebuildStarter = interaction.options.getBoolean('rebuild_starter') ?? true;
    const protectChannels = parseList(interaction.options.getString('protect_channels'));
    const protectRoles = parseList(interaction.options.getString('protect_roles'));

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const wipe = new WipeService(interaction.guild);
    const backup = new BackupService(interaction.guild);

    await interaction.editReply({
      embeds: [
        progressEmbed(
          'Building wipe plan…',
          'Scanning channels and roles, applying protection rules.',
        ),
      ],
    });

    const plan = await wipe.plan({
      protectedChannelNames: protectChannels,
      protectedRoleNames: protectRoles,
    });

    const summary = renderPlan(plan, dryRun, rebuildStarter);

    const planAttachment = new AttachmentBuilder(
      Buffer.from(JSON.stringify(plan, null, 2), 'utf8'),
      { name: `wipe-plan-${plan.guildId}.json` },
    );

    if (dryRun) {
      await interaction.editReply({
        embeds: [summary, dryRunBanner()],
        files: [planAttachment],
      });
      return;
    }

    // --- Confirmation gate ----------------------------------------------
    const components = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('server-wipe:preview')
          .setLabel('Preview Wipe')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('server-wipe:confirm')
          .setLabel(`${BRAND.emoji.danger} Confirm Wipe`)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('server-wipe:cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary),
      ),
    ];

    const message = await interaction.editReply({
      embeds: [summary, dangerBanner()],
      components,
      files: [planAttachment],
    });

    let confirmed = false;
    let attempts = 0;
    while (!confirmed && attempts < 3) {
      attempts++;
      const press = await message
        .awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (i) => i.user.id === interaction.user.id,
          time: TIMEOUT_MS,
        })
        .catch(() => null);

      if (!press) {
        await interaction.editReply({
          embeds: [warningEmbed('Timed out', 'No confirmation received. Wipe cancelled.')],
          components: [],
          files: [],
        });
        return;
      }

      if (press.customId === 'server-wipe:cancel') {
        await press.update({
          embeds: [infoEmbed('Cancelled', 'No changes were made.')],
          components: [],
          files: [],
        });
        return;
      }

      if (press.customId === 'server-wipe:preview') {
        await press.reply({
          embeds: [renderPreview(plan)],
          flags: MessageFlags.Ephemeral,
        });
        continue;
      }

      // Confirm — open typed-phrase modal
      const modal = new ModalBuilder()
        .setCustomId('server-wipe:phrase-modal')
        .setTitle('Confirm Server Wipe')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('phrase')
              .setLabel(`Type exactly: ${CONFIRM_PHRASE}`)
              .setStyle(TextInputStyle.Short)
              .setMinLength(CONFIRM_PHRASE.length)
              .setMaxLength(CONFIRM_PHRASE.length)
              .setRequired(true),
          ),
        );
      await press.showModal(modal);

      const submission = await press
        .awaitModalSubmit({
          filter: (i) =>
            i.user.id === interaction.user.id && i.customId === 'server-wipe:phrase-modal',
          time: TIMEOUT_MS,
        })
        .catch(() => null);

      if (!submission) {
        await interaction.editReply({
          embeds: [warningEmbed('Timed out', 'Confirmation modal closed. Wipe cancelled.')],
          components: [],
          files: [],
        });
        return;
      }

      const typed = submission.fields.getTextInputValue('phrase').trim();
      if (typed !== CONFIRM_PHRASE) {
        await submission.reply({
          embeds: [errorEmbed('Phrase mismatch', `You must type **${CONFIRM_PHRASE}** exactly.`)],
          flags: MessageFlags.Ephemeral,
        });
        continue;
      }

      await submission.reply({
        embeds: [progressEmbed('Wipe authorized', 'Taking a backup snapshot, then executing.')],
        flags: MessageFlags.Ephemeral,
      });
      confirmed = true;
    }

    if (!confirmed) {
      await interaction.editReply({
        embeds: [errorEmbed('Aborted', 'Too many failed confirmation attempts.')],
        components: [],
        files: [],
      });
      return;
    }

    // --- Backup ----------------------------------------------------------
    const snapshot = await backup.snapshot();
    const backupAttachment = new AttachmentBuilder(
      Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8'),
      { name: `wipe-backup-${snapshot.guildId}-${Date.now()}.json` },
    );

    await interaction.editReply({
      embeds: [
        progressEmbed(
          'Wiping…',
          'Deleting channels and roles. Backup attached for rollback reference.',
        ),
      ],
      components: [],
      files: [backupAttachment],
    });

    // --- Execute ---------------------------------------------------------
    const report = await wipe.execute({
      protectedChannelNames: protectChannels,
      protectedRoleNames: protectRoles,
    });
    logger.info('Wipe report', report);

    if (rebuildStarter) {
      try {
        await wipe.rebuildStarter();
      } catch (err) {
        report.errors.push(`Starter rebuild failed: ${(err as Error).message}`);
      }
    }

    const final =
      report.errors.length > 0
        ? warningEmbed(
            'Wipe completed with warnings',
            [
              `**Channels deleted:** ${report.deletedChannels.length}`,
              `**Roles deleted:** ${report.deletedRoles.length}`,
              `**Starter rebuilt:** ${rebuildStarter ? 'yes' : 'no'}`,
              `**Errors:** ${report.errors.length}`,
              '',
              '**First errors:**',
              ...report.errors.slice(0, 5).map((e) => `• ${e}`),
            ].join('\n'),
          )
        : successEmbed(
            'Wipe complete',
            [
              `**Channels deleted:** ${report.deletedChannels.length}`,
              `**Roles deleted:** ${report.deletedRoles.length}`,
              `**Starter rebuilt:** ${rebuildStarter ? 'yes' : 'no'}`,
            ].join('\n'),
          );

    await interaction.editReply({ embeds: [final], components: [], files: [backupAttachment] });
  },
};

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function renderPlan(plan: ReturnType<WipeService['plan']> extends Promise<infer T> ? T : never, dryRun: boolean, rebuildStarter: boolean) {
  const d = plan.willDelete;
  const k = plan.willKeep;
  const totalDelete =
    d.categories.length +
    d.textChannels.length +
    d.voiceChannels.length +
    d.forumChannels.length +
    d.otherChannels.length;

  return brandEmbed(
    `Wipe Plan · ${plan.guildName}`,
    [
      `Mode: **${dryRun ? 'DRY RUN' : 'LIVE'}** · Rebuild starter: **${rebuildStarter ? 'yes' : 'no'}**`,
      '',
      '**Will delete**',
      `• Categories: ${d.categories.length}`,
      `• Text channels: ${d.textChannels.length}`,
      `• Voice channels: ${d.voiceChannels.length}`,
      `• Forum channels: ${d.forumChannels.length}`,
      `• Other channels: ${d.otherChannels.length}`,
      `• Roles: ${d.roles.length}`,
      `**Total channels:** ${totalDelete} · **Total roles:** ${d.roles.length}`,
      '',
      '**Will keep**',
      `• Channels: ${k.channels.length}`,
      `• Roles: ${k.roles.length} (includes @everyone, integrations, bot roles)`,
    ].join('\n'),
  );
}

function renderPreview(plan: ReturnType<WipeService['plan']> extends Promise<infer T> ? T : never) {
  const sample = (arr: { name: string }[], n = 10) =>
    arr.slice(0, n).map((x) => `\`${x.name}\``).join(', ') +
    (arr.length > n ? ` … +${arr.length - n} more` : '');

  return brandEmbed(
    'Wipe Preview',
    [
      '**Deleting channels:**',
      sample(
        [
          ...plan.willDelete.textChannels,
          ...plan.willDelete.voiceChannels,
          ...plan.willDelete.forumChannels,
          ...plan.willDelete.otherChannels,
          ...plan.willDelete.categories,
        ],
        20,
      ) || '_none_',
      '',
      '**Deleting roles:**',
      sample(plan.willDelete.roles, 20) || '_none_',
      '',
      '**Keeping (protected):**',
      'Channels: ' + (sample(plan.willKeep.channels, 10) || '_none_'),
      'Roles: ' + (sample(plan.willKeep.roles, 10) || '_none_'),
    ].join('\n'),
  );
}

function dangerBanner() {
  return dangerEmbed(
    'IRREVERSIBLE ACTION',
    [
      'You are about to **wipe the server**.',
      '',
      '• A backup snapshot will be attached to the result.',
      '• @everyone, managed, integration, and the bot\'s own roles are **always** preserved.',
      '• Press **Confirm Wipe** and type `WIPE SERVER` exactly.',
    ].join('\n'),
  );
}

function dryRunBanner() {
  return infoEmbed(
    'Dry-run',
    'No changes made. Re-run with `dry_run:false` to execute.',
  );
}

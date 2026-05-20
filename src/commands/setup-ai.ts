import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type StringSelectMenuInteraction,
} from 'discord.js';
import type { BotCommand, ServerTemplate } from '../types/template.js';
import {
  SERVER_TYPES,
  SERVER_TYPE_LABELS,
  SYSTEMS,
  SYSTEM_LABELS,
  VIBES,
  VIBE_LABELS,
  type ServerType,
  type SetupAnswers,
  type SystemKind,
  type Vibe,
} from '../types/setup.js';
import { aiService } from '../services/aiService.js';
import { GuildBuilder } from '../services/guildBuilder.js';
import {
  brandEmbed,
  errorEmbed,
  infoEmbed,
  progressEmbed,
  successEmbed,
} from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { BRAND } from '../utils/branding.js';

const STEP_TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// Slash command surface
// ---------------------------------------------------------------------------

export const setupAiCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('setup-ai')
    .setDescription('Generate a complete Discord server with SwansonX AI.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString())
    .setDMPermission(false)
    .addBooleanOption((opt) =>
      opt
        .setName('rename_server')
        .setDescription('Rename the server to match the template.')
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

    const renameServer = interaction.options.getBoolean('rename_server') ?? false;
    const skipExisting = interaction.options.getBoolean('skip_existing') ?? true;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await runSetupFlow(interaction, { renameServer, skipExisting });
  },
};

interface FlowOptions {
  renameServer: boolean;
  skipExisting: boolean;
}

// ---------------------------------------------------------------------------
// Interactive flow
// ---------------------------------------------------------------------------

async function runSetupFlow(
  interaction: ChatInputCommandInteraction,
  opts: FlowOptions,
): Promise<void> {
  const intro = brandEmbed(
    'SwansonX Setup',
    [
      'Welcome to the **SwansonX AI infrastructure generator**.',
      '',
      'Answer three quick questions and the bot will generate a full server plan:',
      `${BRAND.emoji.chip} **Server type** — what kind of community is this`,
      `${BRAND.emoji.chip} **Vibe** — tone and style`,
      `${BRAND.emoji.chip} **Systems** — features you want (tickets, verification, …)`,
      '',
      'Step 1 of 3 — pick a server type.',
    ].join('\n'),
  );

  const typeMenu = new StringSelectMenuBuilder()
    .setCustomId('setup-ai:type')
    .setPlaceholder('Choose server type…')
    .addOptions(
      SERVER_TYPES.map((t) => ({
        value: t,
        label: SERVER_TYPE_LABELS[t],
      })),
    );

  const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('setup-ai:cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  );

  const message = await interaction.editReply({
    embeds: [intro],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(typeMenu),
      cancelRow,
    ],
  });

  // Step 1: server type
  const typeChoice = await collectAny(message, interaction.user.id, ['setup-ai:type', 'setup-ai:cancel']);
  if (!typeChoice) return await timeout(interaction);
  if (typeChoice.customId === 'setup-ai:cancel') return await cancel(typeChoice);
  if (!typeChoice.isStringSelectMenu()) return await timeout(interaction);
  const type = typeChoice.values[0] as ServerType;

  // Step 2: vibe
  const vibeMenu = new StringSelectMenuBuilder()
    .setCustomId('setup-ai:vibe')
    .setPlaceholder('Choose a vibe…')
    .addOptions(VIBES.map((v) => ({ value: v, label: VIBE_LABELS[v] })));

  await typeChoice.update({
    embeds: [
      brandEmbed(
        'SwansonX Setup · Step 2 of 3',
        `**Server type:** ${SERVER_TYPE_LABELS[type]}\n\nNow pick the **vibe** — this sets tone and colors.`,
      ),
    ],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(vibeMenu),
      cancelRow,
    ],
  });

  const vibeChoice = await collectAny(message, interaction.user.id, ['setup-ai:vibe', 'setup-ai:cancel']);
  if (!vibeChoice) return await timeout(interaction);
  if (vibeChoice.customId === 'setup-ai:cancel') return await cancel(vibeChoice);
  if (!vibeChoice.isStringSelectMenu()) return await timeout(interaction);
  const vibe = vibeChoice.values[0] as Vibe;

  // Step 3: systems (multi-select)
  const systemsMenu = new StringSelectMenuBuilder()
    .setCustomId('setup-ai:systems')
    .setPlaceholder('Pick the systems to install…')
    .setMinValues(0)
    .setMaxValues(SYSTEMS.length)
    .addOptions(SYSTEMS.map((s) => ({ value: s, label: SYSTEM_LABELS[s] })));

  const skipBtn = new ButtonBuilder()
    .setCustomId('setup-ai:skip-systems')
    .setLabel('Skip — no extra systems')
    .setStyle(ButtonStyle.Secondary);

  await vibeChoice.update({
    embeds: [
      brandEmbed(
        'SwansonX Setup · Step 3 of 3',
        [
          `**Server type:** ${SERVER_TYPE_LABELS[type]}`,
          `**Vibe:** ${VIBE_LABELS[vibe]}`,
          '',
          'Pick any systems you want bolted on (multi-select). You can skip this step.',
        ].join('\n'),
      ),
    ],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(systemsMenu),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        skipBtn,
        new ButtonBuilder()
          .setCustomId('setup-ai:cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  });

  const sysChoice = await collectAny(message, interaction.user.id, [
    'setup-ai:systems',
    'setup-ai:skip-systems',
    'setup-ai:cancel',
  ]);
  if (!sysChoice) return await timeout(interaction);
  if (sysChoice.customId === 'setup-ai:cancel') return await cancel(sysChoice);

  const systems: SystemKind[] = sysChoice.isStringSelectMenu()
    ? (sysChoice.values as SystemKind[])
    : [];

  // Generate the plan
  const answers: SetupAnswers = { type, vibe, systems };
  const { template, notes } = aiService.generate(answers);

  await showPreview(sysChoice, interaction, message, template, notes, opts);
}

// ---------------------------------------------------------------------------
// Preview + confirm
// ---------------------------------------------------------------------------

async function showPreview(
  ack: ButtonInteraction | StringSelectMenuInteraction,
  source: ChatInputCommandInteraction,
  message: Awaited<ReturnType<ChatInputCommandInteraction['editReply']>>,
  template: ServerTemplate,
  notes: string[],
  opts: FlowOptions,
): Promise<void> {
  const channelCount = template.categories.reduce((n, c) => n + c.channels.length, 0);

  const previewEmbed = brandEmbed(
    `Preview · ${template.name}`,
    [
      template.description,
      '',
      `**Roles:** ${template.roles.length}`,
      `**Categories:** ${template.categories.length}`,
      `**Channels:** ${channelCount}`,
      `**Onboarding:** ${template.onboarding ? 'yes' : 'no'}`,
      '',
      '**Generation notes**',
      notes.map((n) => `• ${n}`).join('\n'),
      '',
      `Press **Confirm & Build** within ${Math.floor(STEP_TIMEOUT_MS / 1000)}s.`,
    ].join('\n'),
  );

  const jsonAttachment = new AttachmentBuilder(
    Buffer.from(JSON.stringify(template, null, 2), 'utf8'),
    { name: `${template.id}.template.json` },
  );

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('setup-ai:confirm')
      .setLabel('Confirm & Build')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('setup-ai:cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  );

  await ack.update({
    embeds: [previewEmbed],
    components: [buttons],
    files: [jsonAttachment],
  });

  const press = await collectButton(message, source.user.id, [
    'setup-ai:confirm',
    'setup-ai:cancel',
  ]);
  if (!press) return await timeout(source);
  if (press.customId === 'setup-ai:cancel') return await cancel(press);

  await press.update({
    embeds: [
      progressEmbed(
        'Building…',
        `Provisioning **${template.name}**. This can take a minute on busy servers.`,
      ),
    ],
    components: [],
    files: [],
  });

  const builder = new GuildBuilder(source.guild!);
  const report = await builder.build(template, {
    applyServerName: opts.renameServer,
    skipExisting: opts.skipExisting,
  });

  logger.info('Build report', report);

  const summary =
    `**Roles created:** ${report.rolesCreated.length} (${report.rolesSkipped.length} skipped)\n` +
    `**Categories created:** ${report.categoriesCreated.length}\n` +
    `**Channels created:** ${report.channelsCreated.length}\n` +
    `**Errors:** ${report.errors.length}`;

  if (report.errors.length > 0) {
    await source.editReply({
      embeds: [
        errorEmbed(
          `Built with ${report.errors.length} error(s)`,
          `${summary}\n\n**First errors:**\n${report.errors
            .slice(0, 5)
            .map((e) => `• ${e}`)
            .join('\n')}`,
        ),
      ],
    });
  } else {
    await source.editReply({
      embeds: [successEmbed(`Server "${template.name}" provisioned`, summary)],
    });
  }
}

// ---------------------------------------------------------------------------
// Collector helpers
// ---------------------------------------------------------------------------

async function collectAny(
  message: Awaited<ReturnType<ChatInputCommandInteraction['editReply']>>,
  userId: string,
  customIds: string[],
): Promise<ButtonInteraction | StringSelectMenuInteraction | null> {
  try {
    const i = await message.awaitMessageComponent({
      filter: (i) => i.user.id === userId && customIds.includes(i.customId),
      time: STEP_TIMEOUT_MS,
    });
    if (i.isButton() || i.isStringSelectMenu()) return i;
    return null;
  } catch {
    return null;
  }
}

async function collectButton(
  message: Awaited<ReturnType<ChatInputCommandInteraction['editReply']>>,
  userId: string,
  customIds: string[],
): Promise<ButtonInteraction | null> {
  try {
    const i = await message.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === userId && customIds.includes(i.customId),
      time: STEP_TIMEOUT_MS,
    });
    return i;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Terminal helpers
// ---------------------------------------------------------------------------

async function timeout(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction
    .editReply({
      embeds: [errorEmbed('Timed out', 'No response received. Re-run `/setup-ai` to try again.')],
      components: [],
      files: [],
    })
    .catch(() => undefined);
}

async function cancel(
  ack: ButtonInteraction | StringSelectMenuInteraction,
): Promise<void> {
  await ack.update({
    embeds: [infoEmbed('Cancelled', 'No changes were made.')],
    components: [],
    files: [],
  });
}

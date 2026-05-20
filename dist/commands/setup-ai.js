"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAiCommand = void 0;
const discord_js_1 = require("discord.js");
const setup_js_1 = require("../types/setup.js");
const aiService_js_1 = require("../services/aiService.js");
const guildBuilder_js_1 = require("../services/guildBuilder.js");
const embeds_js_1 = require("../utils/embeds.js");
const logger_js_1 = require("../utils/logger.js");
const branding_js_1 = require("../utils/branding.js");
const STEP_TIMEOUT_MS = 120_000;
// ---------------------------------------------------------------------------
// Slash command surface
// ---------------------------------------------------------------------------
exports.setupAiCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setup-ai')
        .setDescription('Generate a complete Discord server with SwansonX AI.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator.toString())
        .setDMPermission(false)
        .addBooleanOption((opt) => opt
        .setName('rename_server')
        .setDescription('Rename the server to match the template.')
        .setRequired(false))
        .addBooleanOption((opt) => opt
        .setName('skip_existing')
        .setDescription('Skip channels/roles that already exist (default true).')
        .setRequired(false)),
    async execute(interaction) {
        if (!interaction.inGuild() || !interaction.guild) {
            await interaction.reply({
                embeds: [(0, embeds_js_1.errorEmbed)('Guild only', 'This command must be run in a server.')],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const renameServer = interaction.options.getBoolean('rename_server') ?? false;
        const skipExisting = interaction.options.getBoolean('skip_existing') ?? true;
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        await runSetupFlow(interaction, { renameServer, skipExisting });
    },
};
// ---------------------------------------------------------------------------
// Interactive flow
// ---------------------------------------------------------------------------
async function runSetupFlow(interaction, opts) {
    const intro = (0, embeds_js_1.brandEmbed)('SwansonX Setup', [
        'Welcome to the **SwansonX AI infrastructure generator**.',
        '',
        'Answer three quick questions and the bot will generate a full server plan:',
        `${branding_js_1.BRAND.emoji.chip} **Server type** — what kind of community is this`,
        `${branding_js_1.BRAND.emoji.chip} **Vibe** — tone and style`,
        `${branding_js_1.BRAND.emoji.chip} **Systems** — features you want (tickets, verification, …)`,
        '',
        'Step 1 of 3 — pick a server type.',
    ].join('\n'));
    const typeMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('setup-ai:type')
        .setPlaceholder('Choose server type…')
        .addOptions(setup_js_1.SERVER_TYPES.map((t) => ({
        value: t,
        label: setup_js_1.SERVER_TYPE_LABELS[t],
    })));
    const cancelRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('setup-ai:cancel')
        .setLabel('Cancel')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    const message = await interaction.editReply({
        embeds: [intro],
        components: [
            new discord_js_1.ActionRowBuilder().addComponents(typeMenu),
            cancelRow,
        ],
    });
    // Step 1: server type
    const typeChoice = await collectAny(message, interaction.user.id, ['setup-ai:type', 'setup-ai:cancel']);
    if (!typeChoice)
        return await timeout(interaction);
    if (typeChoice.customId === 'setup-ai:cancel')
        return await cancel(typeChoice);
    if (!typeChoice.isStringSelectMenu())
        return await timeout(interaction);
    const type = typeChoice.values[0];
    // Step 2: vibe
    const vibeMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('setup-ai:vibe')
        .setPlaceholder('Choose a vibe…')
        .addOptions(setup_js_1.VIBES.map((v) => ({ value: v, label: setup_js_1.VIBE_LABELS[v] })));
    await typeChoice.update({
        embeds: [
            (0, embeds_js_1.brandEmbed)('SwansonX Setup · Step 2 of 3', `**Server type:** ${setup_js_1.SERVER_TYPE_LABELS[type]}\n\nNow pick the **vibe** — this sets tone and colors.`),
        ],
        components: [
            new discord_js_1.ActionRowBuilder().addComponents(vibeMenu),
            cancelRow,
        ],
    });
    const vibeChoice = await collectAny(message, interaction.user.id, ['setup-ai:vibe', 'setup-ai:cancel']);
    if (!vibeChoice)
        return await timeout(interaction);
    if (vibeChoice.customId === 'setup-ai:cancel')
        return await cancel(vibeChoice);
    if (!vibeChoice.isStringSelectMenu())
        return await timeout(interaction);
    const vibe = vibeChoice.values[0];
    // Step 3: systems (multi-select)
    const systemsMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('setup-ai:systems')
        .setPlaceholder('Pick the systems to install…')
        .setMinValues(0)
        .setMaxValues(setup_js_1.SYSTEMS.length)
        .addOptions(setup_js_1.SYSTEMS.map((s) => ({ value: s, label: setup_js_1.SYSTEM_LABELS[s] })));
    const skipBtn = new discord_js_1.ButtonBuilder()
        .setCustomId('setup-ai:skip-systems')
        .setLabel('Skip — no extra systems')
        .setStyle(discord_js_1.ButtonStyle.Secondary);
    await vibeChoice.update({
        embeds: [
            (0, embeds_js_1.brandEmbed)('SwansonX Setup · Step 3 of 3', [
                `**Server type:** ${setup_js_1.SERVER_TYPE_LABELS[type]}`,
                `**Vibe:** ${setup_js_1.VIBE_LABELS[vibe]}`,
                '',
                'Pick any systems you want bolted on (multi-select). You can skip this step.',
            ].join('\n')),
        ],
        components: [
            new discord_js_1.ActionRowBuilder().addComponents(systemsMenu),
            new discord_js_1.ActionRowBuilder().addComponents(skipBtn, new discord_js_1.ButtonBuilder()
                .setCustomId('setup-ai:cancel')
                .setLabel('Cancel')
                .setStyle(discord_js_1.ButtonStyle.Secondary)),
        ],
    });
    const sysChoice = await collectAny(message, interaction.user.id, [
        'setup-ai:systems',
        'setup-ai:skip-systems',
        'setup-ai:cancel',
    ]);
    if (!sysChoice)
        return await timeout(interaction);
    if (sysChoice.customId === 'setup-ai:cancel')
        return await cancel(sysChoice);
    const systems = sysChoice.isStringSelectMenu()
        ? sysChoice.values
        : [];
    // Generate the plan
    const answers = { type, vibe, systems };
    const { template, notes } = aiService_js_1.aiService.generate(answers);
    await showPreview(sysChoice, interaction, message, template, notes, opts);
}
// ---------------------------------------------------------------------------
// Preview + confirm
// ---------------------------------------------------------------------------
async function showPreview(ack, source, message, template, notes, opts) {
    const channelCount = template.categories.reduce((n, c) => n + c.channels.length, 0);
    const previewEmbed = (0, embeds_js_1.brandEmbed)(`Preview · ${template.name}`, [
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
    ].join('\n'));
    const jsonAttachment = new discord_js_1.AttachmentBuilder(Buffer.from(JSON.stringify(template, null, 2), 'utf8'), { name: `${template.id}.template.json` });
    const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('setup-ai:confirm')
        .setLabel('Confirm & Build')
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId('setup-ai:cancel')
        .setLabel('Cancel')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    await ack.update({
        embeds: [previewEmbed],
        components: [buttons],
        files: [jsonAttachment],
    });
    const press = await collectButton(message, source.user.id, [
        'setup-ai:confirm',
        'setup-ai:cancel',
    ]);
    if (!press)
        return await timeout(source);
    if (press.customId === 'setup-ai:cancel')
        return await cancel(press);
    await press.update({
        embeds: [
            (0, embeds_js_1.progressEmbed)('Building…', `Provisioning **${template.name}**. This can take a minute on busy servers.`),
        ],
        components: [],
        files: [],
    });
    const builder = new guildBuilder_js_1.GuildBuilder(source.guild);
    const report = await builder.build(template, {
        applyServerName: opts.renameServer,
        skipExisting: opts.skipExisting,
    });
    logger_js_1.logger.info('Build report', report);
    const summary = `**Roles created:** ${report.rolesCreated.length} (${report.rolesSkipped.length} skipped)\n` +
        `**Categories created:** ${report.categoriesCreated.length}\n` +
        `**Channels created:** ${report.channelsCreated.length}\n` +
        `**Errors:** ${report.errors.length}`;
    if (report.errors.length > 0) {
        await source.editReply({
            embeds: [
                (0, embeds_js_1.errorEmbed)(`Built with ${report.errors.length} error(s)`, `${summary}\n\n**First errors:**\n${report.errors
                    .slice(0, 5)
                    .map((e) => `• ${e}`)
                    .join('\n')}`),
            ],
        });
    }
    else {
        await source.editReply({
            embeds: [(0, embeds_js_1.successEmbed)(`Server "${template.name}" provisioned`, summary)],
        });
    }
}
// ---------------------------------------------------------------------------
// Collector helpers
// ---------------------------------------------------------------------------
async function collectAny(message, userId, customIds) {
    try {
        const i = await message.awaitMessageComponent({
            filter: (i) => i.user.id === userId && customIds.includes(i.customId),
            time: STEP_TIMEOUT_MS,
        });
        if (i.isButton() || i.isStringSelectMenu())
            return i;
        return null;
    }
    catch {
        return null;
    }
}
async function collectButton(message, userId, customIds) {
    try {
        const i = await message.awaitMessageComponent({
            componentType: discord_js_1.ComponentType.Button,
            filter: (i) => i.user.id === userId && customIds.includes(i.customId),
            time: STEP_TIMEOUT_MS,
        });
        return i;
    }
    catch {
        return null;
    }
}
// ---------------------------------------------------------------------------
// Terminal helpers
// ---------------------------------------------------------------------------
async function timeout(interaction) {
    await interaction
        .editReply({
        embeds: [(0, embeds_js_1.errorEmbed)('Timed out', 'No response received. Re-run `/setup-ai` to try again.')],
        components: [],
        files: [],
    })
        .catch(() => undefined);
}
async function cancel(ack) {
    await ack.update({
        embeds: [(0, embeds_js_1.infoEmbed)('Cancelled', 'No changes were made.')],
        components: [],
        files: [],
    });
}
//# sourceMappingURL=setup-ai.js.map
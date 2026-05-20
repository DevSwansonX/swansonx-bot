"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAiCommand = void 0;
const discord_js_1 = require("discord.js");
const templateService_js_1 = require("../services/templateService.js");
const guildBuilder_js_1 = require("../services/guildBuilder.js");
const embeds_js_1 = require("../utils/embeds.js");
const logger_js_1 = require("../utils/logger.js");
const CONFIRM_TIMEOUT_MS = 60_000;
exports.setupAiCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setup-ai')
        .setDescription('Spin up a full server (roles, categories, channels, onboarding) from a template.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator.toString())
        .setDMPermission(false)
        .addStringOption((opt) => opt
        .setName('template')
        .setDescription('Which preset to use.')
        .setRequired(true)
        .addChoices({ name: 'Minecraft community', value: 'minecraft' }, { name: 'AI community', value: 'ai-community' }, { name: 'Startup HQ', value: 'startup' }, { name: 'AI-generated (from answers)', value: 'ai' }))
        .addStringOption((opt) => opt.setName('topic').setDescription('Topic / niche (used when template=ai).').setRequired(false))
        .addStringOption((opt) => opt.setName('audience').setDescription('Who is this for? (used when template=ai)').setRequired(false))
        .addStringOption((opt) => opt.setName('vibe').setDescription('Tone / vibe (used when template=ai).').setRequired(false))
        .addBooleanOption((opt) => opt
        .setName('rename_server')
        .setDescription('Also rename the server to match the template (default false).')
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
        const templateId = interaction.options.getString('template', true);
        const topic = interaction.options.getString('topic') ?? '';
        const audience = interaction.options.getString('audience') ?? '';
        const vibe = interaction.options.getString('vibe') ?? '';
        const renameServer = interaction.options.getBoolean('rename_server') ?? false;
        const skipExisting = interaction.options.getBoolean('skip_existing') ?? true;
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        let template;
        if (templateId === 'ai') {
            if (!topic) {
                await interaction.editReply({
                    embeds: [(0, embeds_js_1.errorEmbed)('Missing topic', 'When using `template:ai`, provide a `topic` option.')],
                });
                return;
            }
            template = await templateService_js_1.templateService.generateFromAnswers({ topic, audience, vibe });
        }
        else {
            template = templateService_js_1.templateService.get(templateId);
        }
        if (!template) {
            await interaction.editReply({
                embeds: [(0, embeds_js_1.errorEmbed)('Unknown template', `No template registered for "${templateId}".`)],
            });
            return;
        }
        const preview = (0, embeds_js_1.infoEmbed)(`Preview: ${template.name}`, `${template.description}\n\n` +
            `**Roles:** ${template.roles.length}\n` +
            `**Categories:** ${template.categories.length}\n` +
            `**Channels:** ${template.categories.reduce((n, c) => n + c.channels.length, 0)}\n` +
            `**Onboarding:** ${template.onboarding ? 'yes' : 'no'}\n\n` +
            `React with **Confirm** within ${CONFIRM_TIMEOUT_MS / 1000}s to build.`);
        const jsonAttachment = new discord_js_1.AttachmentBuilder(Buffer.from(JSON.stringify(template, null, 2), 'utf8'), {
            name: `${template.id}.template.json`,
        });
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('setup-ai:confirm').setLabel('Confirm & Build').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('setup-ai:cancel').setLabel('Cancel').setStyle(discord_js_1.ButtonStyle.Secondary));
        const message = await interaction.editReply({ embeds: [preview], files: [jsonAttachment], components: [buttons] });
        let press;
        try {
            press = await message.awaitMessageComponent({
                componentType: discord_js_1.ComponentType.Button,
                filter: (i) => i.user.id === interaction.user.id,
                time: CONFIRM_TIMEOUT_MS,
            });
        }
        catch {
            await interaction.editReply({
                embeds: [(0, embeds_js_1.errorEmbed)('Timed out', 'No confirmation received. Re-run /setup-ai to try again.')],
                components: [],
            });
            return;
        }
        if (press.customId === 'setup-ai:cancel') {
            await press.update({
                embeds: [(0, embeds_js_1.infoEmbed)('Cancelled', 'No changes were made.')],
                components: [],
                files: [],
            });
            return;
        }
        await press.update({
            embeds: [(0, embeds_js_1.infoEmbed)('Building…', `Provisioning **${template.name}**. This can take a minute on busy servers.`)],
            components: [],
            files: [],
        });
        const builder = new guildBuilder_js_1.GuildBuilder(interaction.guild);
        const report = await builder.build(template, { applyServerName: renameServer, skipExisting });
        logger_js_1.logger.info('Build report', report);
        const summary = `**Roles created:** ${report.rolesCreated.length} (${report.rolesSkipped.length} skipped)\n` +
            `**Categories created:** ${report.categoriesCreated.length}\n` +
            `**Channels created:** ${report.channelsCreated.length}\n` +
            `**Errors:** ${report.errors.length}`;
        if (report.errors.length > 0) {
            await interaction.editReply({
                embeds: [
                    (0, embeds_js_1.errorEmbed)(`Built with ${report.errors.length} error(s)`, `${summary}\n\n**First errors:**\n${report.errors.slice(0, 5).map((e) => `• ${e}`).join('\n')}`),
                ],
            });
        }
        else {
            await interaction.editReply({
                embeds: [(0, embeds_js_1.successEmbed)(`Server "${template.name}" provisioned`, summary)],
            });
        }
    },
};
//# sourceMappingURL=setup-ai.js.map
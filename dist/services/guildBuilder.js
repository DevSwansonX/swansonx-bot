"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildBuilder = void 0;
const discord_js_1 = require("discord.js");
const embeds_js_1 = require("../utils/embeds.js");
const logger_js_1 = require("../utils/logger.js");
const permissions_js_1 = require("../utils/permissions.js");
const CHANNEL_KIND_MAP = {
    text: discord_js_1.ChannelType.GuildText,
    voice: discord_js_1.ChannelType.GuildVoice,
    announcement: discord_js_1.ChannelType.GuildAnnouncement,
    forum: discord_js_1.ChannelType.GuildForum,
    stage: discord_js_1.ChannelType.GuildStageVoice,
};
class GuildBuilder {
    guild;
    constructor(guild) {
        this.guild = guild;
    }
    async build(template, options = {}) {
        const opts = {
            applyServerName: options.applyServerName ?? false,
            skipExisting: options.skipExisting ?? true,
        };
        const report = {
            template: template.id,
            rolesCreated: [],
            rolesSkipped: [],
            categoriesCreated: [],
            channelsCreated: [],
            errors: [],
        };
        logger_js_1.logger.info(`Building guild "${this.guild.name}" from template "${template.id}"`);
        if (opts.applyServerName && template.serverName) {
            try {
                await this.guild.setName(template.serverName);
            }
            catch (err) {
                report.errors.push(`Failed to rename server: ${err.message}`);
            }
        }
        const roleMap = await this.createRoles(template.roles, opts, report);
        for (const category of template.categories) {
            try {
                await this.createCategory(category, roleMap, opts, report);
            }
            catch (err) {
                report.errors.push(`Category "${category.name}" failed: ${err.message}`);
                logger_js_1.logger.error(`Category "${category.name}" failed`, err);
            }
        }
        if (template.onboarding) {
            try {
                await this.applyOnboarding(template, report);
            }
            catch (err) {
                report.errors.push(`Onboarding failed: ${err.message}`);
            }
        }
        return report;
    }
    async createRoles(specs, opts, report) {
        const map = new Map();
        for (const spec of specs) {
            const existing = this.guild.roles.cache.find((r) => r.name === spec.name);
            if (existing && opts.skipExisting) {
                map.set(spec.name, existing);
                report.rolesSkipped.push(spec.name);
                continue;
            }
            try {
                const role = await this.guild.roles.create({
                    name: spec.name,
                    color: (0, permissions_js_1.resolveColor)(spec.color),
                    hoist: spec.hoist ?? false,
                    mentionable: spec.mentionable ?? false,
                    permissions: (0, permissions_js_1.resolvePermissions)(spec.permissions),
                    reason: 'SwansonX setup-ai',
                });
                map.set(spec.name, role);
                report.rolesCreated.push(spec.name);
            }
            catch (err) {
                report.errors.push(`Role "${spec.name}" failed: ${err.message}`);
            }
        }
        return map;
    }
    async createCategory(spec, roleMap, opts, report) {
        const existing = this.guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildCategory && c.name === spec.name);
        let category;
        if (existing && opts.skipExisting) {
            category = existing;
        }
        else {
            category = await this.guild.channels.create({
                name: spec.name,
                type: discord_js_1.ChannelType.GuildCategory,
                permissionOverwrites: this.buildVisibility(spec.visibleTo, roleMap),
                reason: 'SwansonX setup-ai',
            });
            report.categoriesCreated.push(spec.name);
        }
        for (const channel of spec.channels) {
            try {
                await this.createChannel(channel, category, spec.visibleTo, roleMap, opts, report);
            }
            catch (err) {
                report.errors.push(`Channel "${channel.name}" failed: ${err.message}`);
            }
        }
    }
    async createChannel(spec, parent, inheritedVisibility, roleMap, opts, report) {
        const existing = this.guild.channels.cache.find((c) => c.parentId === parent.id && c.name === spec.name.toLowerCase().replace(/\s+/g, '-'));
        if (existing && opts.skipExisting)
            return;
        const type = CHANNEL_KIND_MAP[spec.kind];
        const visibility = spec.visibleTo ?? inheritedVisibility;
        const createOpts = {
            name: spec.name,
            type,
            parent: parent.id,
            permissionOverwrites: this.buildVisibility(visibility, roleMap),
            reason: 'SwansonX setup-ai',
        };
        if (spec.topic && (type === discord_js_1.ChannelType.GuildText || type === discord_js_1.ChannelType.GuildAnnouncement || type === discord_js_1.ChannelType.GuildForum)) {
            createOpts.topic = spec.topic;
        }
        if (spec.nsfw !== undefined)
            createOpts.nsfw = spec.nsfw;
        if (spec.slowmodeSeconds !== undefined)
            createOpts.rateLimitPerUser = spec.slowmodeSeconds;
        const channel = await this.guild.channels.create(createOpts);
        report.channelsCreated.push(`${parent.name}/${spec.name}`);
        if (channel.type === discord_js_1.ChannelType.GuildText || channel.type === discord_js_1.ChannelType.GuildAnnouncement) {
            const textChannel = channel;
            if (spec.embeds?.length) {
                for (const e of spec.embeds) {
                    await textChannel.send({ embeds: [(0, embeds_js_1.buildEmbed)(e)] });
                }
            }
            if (spec.messages?.length) {
                for (const m of spec.messages) {
                    await textChannel.send({ content: m });
                }
            }
        }
    }
    buildVisibility(visibleTo, roleMap) {
        if (!visibleTo?.length)
            return undefined;
        const overwrites = [
            { id: this.guild.roles.everyone.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
        ];
        for (const roleName of visibleTo) {
            const role = roleMap.get(roleName) ?? this.guild.roles.cache.find((r) => r.name === roleName);
            if (role) {
                overwrites.push({ id: role.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel] });
            }
        }
        return overwrites;
    }
    async applyOnboarding(template, report) {
        const onboarding = template.onboarding;
        if (!onboarding)
            return;
        const target = this.guild.channels.cache.find((c) => (c.type === discord_js_1.ChannelType.GuildText || c.type === discord_js_1.ChannelType.GuildAnnouncement) &&
            c.name === onboarding.channel.toLowerCase().replace(/\s+/g, '-'));
        if (!target) {
            report.errors.push(`Onboarding channel "${onboarding.channel}" not found`);
            return;
        }
        await target.send({ embeds: [(0, embeds_js_1.buildEmbed)(onboarding.welcome)] });
        if (onboarding.rules) {
            await target.send({ embeds: [(0, embeds_js_1.buildEmbed)(onboarding.rules)] });
        }
    }
}
exports.GuildBuilder = GuildBuilder;
//# sourceMappingURL=guildBuilder.js.map
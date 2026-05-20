import {
  ChannelType,
  PermissionFlagsBits,
  type CategoryChannel,
  type Guild,
  type GuildChannelCreateOptions,
  type OverwriteResolvable,
  type Role,
  type TextChannel,
} from 'discord.js';
import type {
  CategorySpec,
  ChannelSpec,
  RoleSpec,
  ServerTemplate,
} from '../types/template.js';
import { buildEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { resolveColor, resolvePermissions } from '../utils/permissions.js';

export interface BuildReport {
  template: string;
  rolesCreated: string[];
  rolesSkipped: string[];
  categoriesCreated: string[];
  channelsCreated: string[];
  errors: string[];
}

export interface BuildOptions {
  /** If true, rename the guild to template.serverName when provided. */
  applyServerName?: boolean;
  /** If true, skip creating roles/channels that already exist with the same name. */
  skipExisting?: boolean;
}

const CHANNEL_KIND_MAP = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
  stage: ChannelType.GuildStageVoice,
} as const;

export class GuildBuilder {
  constructor(private readonly guild: Guild) {}

  async build(template: ServerTemplate, options: BuildOptions = {}): Promise<BuildReport> {
    const opts: Required<BuildOptions> = {
      applyServerName: options.applyServerName ?? false,
      skipExisting: options.skipExisting ?? true,
    };

    const report: BuildReport = {
      template: template.id,
      rolesCreated: [],
      rolesSkipped: [],
      categoriesCreated: [],
      channelsCreated: [],
      errors: [],
    };

    logger.info(`Building guild "${this.guild.name}" from template "${template.id}"`);

    if (opts.applyServerName && template.serverName) {
      try {
        await this.guild.setName(template.serverName);
      } catch (err) {
        report.errors.push(`Failed to rename server: ${(err as Error).message}`);
      }
    }

    const roleMap = await this.createRoles(template.roles, opts, report);

    for (const category of template.categories) {
      try {
        await this.createCategory(category, roleMap, opts, report);
      } catch (err) {
        report.errors.push(`Category "${category.name}" failed: ${(err as Error).message}`);
        logger.error(`Category "${category.name}" failed`, err);
      }
    }

    if (template.onboarding) {
      try {
        await this.applyOnboarding(template, report);
      } catch (err) {
        report.errors.push(`Onboarding failed: ${(err as Error).message}`);
      }
    }

    return report;
  }

  private async createRoles(
    specs: RoleSpec[],
    opts: Required<BuildOptions>,
    report: BuildReport,
  ): Promise<Map<string, Role>> {
    const map = new Map<string, Role>();
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
          color: resolveColor(spec.color),
          hoist: spec.hoist ?? false,
          mentionable: spec.mentionable ?? false,
          permissions: resolvePermissions(spec.permissions),
          reason: 'SwansonX setup-ai',
        });
        map.set(spec.name, role);
        report.rolesCreated.push(spec.name);
      } catch (err) {
        report.errors.push(`Role "${spec.name}" failed: ${(err as Error).message}`);
      }
    }
    return map;
  }

  private async createCategory(
    spec: CategorySpec,
    roleMap: Map<string, Role>,
    opts: Required<BuildOptions>,
    report: BuildReport,
  ): Promise<void> {
    const existing = this.guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === spec.name,
    ) as CategoryChannel | undefined;

    let category: CategoryChannel;
    if (existing && opts.skipExisting) {
      category = existing;
    } else {
      category = await this.guild.channels.create({
        name: spec.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: this.buildVisibility(spec.visibleTo, roleMap),
        reason: 'SwansonX setup-ai',
      });
      report.categoriesCreated.push(spec.name);
    }

    for (const channel of spec.channels) {
      try {
        await this.createChannel(channel, category, spec.visibleTo, roleMap, opts, report);
      } catch (err) {
        report.errors.push(`Channel "${channel.name}" failed: ${(err as Error).message}`);
      }
    }
  }

  private async createChannel(
    spec: ChannelSpec,
    parent: CategoryChannel,
    inheritedVisibility: string[] | undefined,
    roleMap: Map<string, Role>,
    opts: Required<BuildOptions>,
    report: BuildReport,
  ): Promise<void> {
    const existing = this.guild.channels.cache.find(
      (c) => c.parentId === parent.id && c.name === spec.name.toLowerCase().replace(/\s+/g, '-'),
    );
    if (existing && opts.skipExisting) return;

    const type = CHANNEL_KIND_MAP[spec.kind];
    const visibility = spec.visibleTo ?? inheritedVisibility;

    const createOpts: GuildChannelCreateOptions = {
      name: spec.name,
      type,
      parent: parent.id,
      permissionOverwrites: this.buildVisibility(visibility, roleMap),
      reason: 'SwansonX setup-ai',
    };
    if (spec.topic && (type === ChannelType.GuildText || type === ChannelType.GuildAnnouncement || type === ChannelType.GuildForum)) {
      createOpts.topic = spec.topic;
    }
    if (spec.nsfw !== undefined) createOpts.nsfw = spec.nsfw;
    if (spec.slowmodeSeconds !== undefined) createOpts.rateLimitPerUser = spec.slowmodeSeconds;

    const channel = await this.guild.channels.create(createOpts);
    report.channelsCreated.push(`${parent.name}/${spec.name}`);

    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
      const textChannel = channel as TextChannel;
      if (spec.embeds?.length) {
        for (const e of spec.embeds) {
          await textChannel.send({ embeds: [buildEmbed(e)] });
        }
      }
      if (spec.messages?.length) {
        for (const m of spec.messages) {
          await textChannel.send({ content: m });
        }
      }
    }
  }

  private buildVisibility(
    visibleTo: string[] | undefined,
    roleMap: Map<string, Role>,
  ): GuildChannelCreateOptions['permissionOverwrites'] {
    if (!visibleTo?.length) return undefined;
    const overwrites: OverwriteResolvable[] = [
      { id: this.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ];
    for (const roleName of visibleTo) {
      const role = roleMap.get(roleName) ?? this.guild.roles.cache.find((r) => r.name === roleName);
      if (role) {
        overwrites.push({ id: role.id, allow: [PermissionFlagsBits.ViewChannel] });
      }
    }
    return overwrites;
  }

  private async applyOnboarding(template: ServerTemplate, report: BuildReport): Promise<void> {
    const onboarding = template.onboarding;
    if (!onboarding) return;

    const target = this.guild.channels.cache.find(
      (c) =>
        (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) &&
        c.name === onboarding.channel.toLowerCase().replace(/\s+/g, '-'),
    ) as TextChannel | undefined;

    if (!target) {
      report.errors.push(`Onboarding channel "${onboarding.channel}" not found`);
      return;
    }

    await target.send({ embeds: [buildEmbed(onboarding.welcome)] });
    if (onboarding.rules) {
      await target.send({ embeds: [buildEmbed(onboarding.rules)] });
    }
  }
}

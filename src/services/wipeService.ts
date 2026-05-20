import {
  ChannelType,
  PermissionFlagsBits,
  type CategoryChannel,
  type Guild,
  type GuildBasedChannel,
  type Role,
  type TextChannel,
} from 'discord.js';
import type { WipePlan, WipeProtections, WipeReport } from '../types/wipe.js';
import type { ServerTemplate } from '../types/template.js';
import { GuildBuilder } from './guildBuilder.js';
import { brandEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

/**
 * The bare-minimum server scaffold to lay down after a wipe. Keeps the
 * server usable immediately rather than leaving an empty husk.
 */
export const STARTER_TEMPLATE: ServerTemplate = {
  id: 'starter',
  name: 'SwansonX Starter',
  description: 'Minimal post-wipe scaffold.',
  roles: [],
  categories: [
    {
      name: 'INFO',
      channels: [
        { name: 'welcome', kind: 'text', topic: 'Read this first.' },
        { name: 'rules', kind: 'text', topic: 'Server rules.' },
        { name: 'announcements', kind: 'announcement' },
      ],
    },
    {
      name: 'COMMUNITY',
      channels: [{ name: 'general', kind: 'text' }],
    },
    {
      name: 'SUPPORT',
      channels: [{ name: 'support', kind: 'text' }],
    },
    {
      name: 'STAFF',
      channels: [{ name: 'staff-chat', kind: 'text' }],
    },
  ],
  onboarding: {
    channel: 'welcome',
    welcome: {
      title: '🚀 Fresh Start',
      description:
        'This server was rebuilt with **SwansonX**. Run `/setup-ai` to generate a richer infrastructure.',
    },
  },
};

export interface WipeOptions {
  /** Channel names that must never be deleted. */
  protectedChannelNames?: string[];
  /** Role names that must never be deleted. */
  protectedRoleNames?: string[];
  /** Channel ids that must never be deleted. */
  protectedChannelIds?: string[];
  /** Role ids that must never be deleted. */
  protectedRoleIds?: string[];
}

export class WipeService {
  constructor(private readonly guild: Guild) {}

  protections(options: WipeOptions): WipeProtections {
    return {
      channelIds: new Set(options.protectedChannelIds ?? []),
      channelNames: new Set((options.protectedChannelNames ?? []).map((n) => n.toLowerCase())),
      roleIds: new Set(options.protectedRoleIds ?? []),
      roleNames: new Set((options.protectedRoleNames ?? []).map((n) => n.toLowerCase())),
    };
  }

  /**
   * Compute what the wipe will and will not delete.
   */
  async plan(options: WipeOptions): Promise<WipePlan> {
    const prot = this.protections(options);
    await this.guild.channels.fetch();
    await this.guild.roles.fetch();

    const plan: WipePlan = {
      guildId: this.guild.id,
      guildName: this.guild.name,
      willDelete: {
        categories: [],
        textChannels: [],
        voiceChannels: [],
        forumChannels: [],
        otherChannels: [],
        roles: [],
      },
      willKeep: { channels: [], roles: [] },
    };

    for (const c of this.guild.channels.cache.values()) {
      const reason = this.channelProtectionReason(c, prot);
      if (reason) {
        plan.willKeep.channels.push({ id: c.id, name: c.name, reason });
        continue;
      }
      const entry = { id: c.id, name: c.name };
      switch (c.type) {
        case ChannelType.GuildCategory:
          plan.willDelete.categories.push(entry);
          break;
        case ChannelType.GuildText:
        case ChannelType.GuildAnnouncement:
          plan.willDelete.textChannels.push(entry);
          break;
        case ChannelType.GuildVoice:
        case ChannelType.GuildStageVoice:
          plan.willDelete.voiceChannels.push(entry);
          break;
        case ChannelType.GuildForum:
          plan.willDelete.forumChannels.push(entry);
          break;
        default:
          plan.willDelete.otherChannels.push(entry);
      }
    }

    for (const r of this.guild.roles.cache.values()) {
      const reason = this.roleProtectionReason(r, prot);
      if (reason) {
        plan.willKeep.roles.push({ id: r.id, name: r.name, reason });
        continue;
      }
      plan.willDelete.roles.push({ id: r.id, name: r.name });
    }

    return plan;
  }

  /**
   * Execute the wipe. Caller MUST have already validated the confirmation
   * phrase and permissions.
   */
  async execute(options: WipeOptions): Promise<WipeReport> {
    const plan = await this.plan(options);
    const report: WipeReport = {
      deletedChannels: [],
      deletedRoles: [],
      errors: [],
    };

    const allDeletable: { id: string; name: string }[] = [
      ...plan.willDelete.textChannels,
      ...plan.willDelete.voiceChannels,
      ...plan.willDelete.forumChannels,
      ...plan.willDelete.otherChannels,
      ...plan.willDelete.categories, // categories last so children are gone first
    ];

    for (const ch of allDeletable) {
      try {
        const live = this.guild.channels.cache.get(ch.id);
        if (!live) continue;
        await live.delete('SwansonX /server-wipe');
        report.deletedChannels.push(ch.name);
      } catch (err) {
        report.errors.push(`Channel "${ch.name}": ${(err as Error).message}`);
      }
    }

    for (const r of plan.willDelete.roles) {
      try {
        const live = this.guild.roles.cache.get(r.id);
        if (!live) continue;
        await live.delete('SwansonX /server-wipe');
        report.deletedRoles.push(r.name);
      } catch (err) {
        report.errors.push(`Role "${r.name}": ${(err as Error).message}`);
      }
    }

    return report;
  }

  /**
   * Lay down the minimal starter structure post-wipe.
   */
  async rebuildStarter(): Promise<void> {
    const builder = new GuildBuilder(this.guild);
    const report = await builder.build(STARTER_TEMPLATE, { skipExisting: true });
    logger.info('Starter rebuild report', report);

    // Drop a welcome embed in the new #welcome
    const welcome = this.guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === 'welcome',
    ) as TextChannel | undefined;
    if (welcome) {
      await welcome
        .send({
          embeds: [
            brandEmbed(
              'Server Rebuilt',
              'This server was rebuilt with **SwansonX**. Run `/setup-ai` to generate a full infrastructure with roles, categories, channels, and systems.',
            ),
          ],
        })
        .catch(() => undefined);
    }
  }

  // -------------------------------------------------------------------------
  // Protection logic
  // -------------------------------------------------------------------------

  private channelProtectionReason(
    c: GuildBasedChannel | CategoryChannel,
    prot: WipeProtections,
  ): string | null {
    if (prot.channelIds.has(c.id)) return 'protected by id';
    if (prot.channelNames.has(c.name.toLowerCase())) return 'protected by name';
    return null;
  }

  private roleProtectionReason(role: Role, prot: WipeProtections): string | null {
    if (role.id === this.guild.roles.everyone.id) return '@everyone';
    if (role.managed) return 'managed/integration role';
    if (
      role.tags?.botId !== undefined ||
      role.tags?.integrationId !== undefined ||
      role.tags?.premiumSubscriberRole
    ) {
      return 'integration role';
    }
    // The bot's own top role (can't delete it without losing perms)
    const me = this.guild.members.me;
    if (me?.roles.highest.id === role.id) return 'bot top role';
    if (
      role.permissions.has(PermissionFlagsBits.Administrator) &&
      role.position >= (this.guild.members.me?.roles.highest.position ?? 0)
    ) {
      return 'higher than bot — cannot delete';
    }
    if (prot.roleIds.has(role.id)) return 'protected by id';
    if (prot.roleNames.has(role.name.toLowerCase())) return 'protected by name';
    return null;
  }
}

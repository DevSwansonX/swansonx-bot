import {
  ChannelType,
  PermissionFlagsBits,
  type CategoryChannel,
  type Guild,
  type GuildBasedChannel,
  type Role,
  type TextChannel,
} from 'discord.js';
import type {
  CleanupApplyReport,
  CleanupIssue,
  CleanupReport,
} from '../types/cleanup.js';
import { logger } from '../utils/logger.js';

const VALID_CHANNEL_NAME = /^[a-z0-9][a-z0-9-]{0,99}$/;
const DEAD_CHANNEL_DAYS = 30;
const EMPTY_CATEGORY_THRESHOLD = 0;
const CLUTTERED_CATEGORY_THRESHOLD = 25;

export interface AnalyzeOptions {
  /** Days a text channel must be inactive to count as "dead". */
  deadChannelDays?: number;
}

export interface ApplyOptions {
  dryRun: boolean;
  /** Archive (rename + permissionsync) dead/empty channels rather than delete. */
  archiveOnly?: boolean;
  /** Only act on issues of these kinds. Empty = all. */
  kinds?: CleanupIssue['kind'][];
}

export class CleanupService {
  constructor(private readonly guild: Guild) {}

  async analyze(opts: AnalyzeOptions = {}): Promise<CleanupReport> {
    const days = opts.deadChannelDays ?? DEAD_CHANNEL_DAYS;

    await this.guild.channels.fetch();
    await this.guild.roles.fetch();

    const channels = [...this.guild.channels.cache.values()];
    const roles = [...this.guild.roles.cache.values()];
    const categories = channels.filter((c) => c.type === ChannelType.GuildCategory) as CategoryChannel[];

    const issues: CleanupIssue[] = [];

    issues.push(...this.detectDuplicates(channels));
    issues.push(...this.detectBadNaming(channels));
    issues.push(...this.detectCategoryClutter(categories));
    issues.push(...this.detectEmptyCategories(categories));
    issues.push(...this.detectUnusedRoles(roles));
    issues.push(...this.detectPermissionIssues(channels));
    issues.push(...this.detectInconsistentFormatting(channels));
    issues.push(...(await this.detectDeadChannels(channels, days)));

    return {
      guildId: this.guild.id,
      guildName: this.guild.name,
      scannedAt: new Date().toISOString(),
      totals: {
        channels: channels.filter((c) => c.type !== ChannelType.GuildCategory).length,
        roles: roles.length,
        categories: categories.length,
      },
      issues,
    };
  }

  async apply(report: CleanupReport, opts: ApplyOptions): Promise<CleanupApplyReport> {
    const out: CleanupApplyReport = {
      archivedChannels: [],
      deletedRoles: [],
      renamedChannels: [],
      errors: [],
    };

    const filter = (i: CleanupIssue) => !opts.kinds?.length || opts.kinds.includes(i.kind);
    const targeted = report.issues.filter(filter);

    for (const issue of targeted) {
      try {
        if (opts.dryRun) continue;
        await this.applyIssue(issue, opts, out);
      } catch (err) {
        out.errors.push(`${issue.kind}/${issue.targetName ?? '?'}: ${(err as Error).message}`);
      }
    }

    return out;
  }

  // -------------------------------------------------------------------------
  // Detection
  // -------------------------------------------------------------------------

  private detectDuplicates(channels: GuildBasedChannel[]): CleanupIssue[] {
    const byName = new Map<string, GuildBasedChannel[]>();
    for (const c of channels) {
      if (c.type === ChannelType.GuildCategory) continue;
      const list = byName.get(c.name) ?? [];
      list.push(c);
      byName.set(c.name, list);
    }
    const issues: CleanupIssue[] = [];
    for (const [name, list] of byName) {
      if (list.length > 1) {
        for (const dup of list.slice(1)) {
          issues.push({
            kind: 'duplicate-channel',
            severity: 'warn',
            targetId: dup.id,
            targetName: `#${name}`,
            description: `Channel #${name} exists ${list.length} times.`,
            suggestion: 'Merge or delete the duplicate.',
          });
        }
      }
    }
    return issues;
  }

  private detectBadNaming(channels: GuildBasedChannel[]): CleanupIssue[] {
    const issues: CleanupIssue[] = [];
    for (const c of channels) {
      if (c.type === ChannelType.GuildCategory) continue;
      if (c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice) continue;
      if (!VALID_CHANNEL_NAME.test(c.name)) {
        issues.push({
          kind: 'bad-naming',
          severity: 'info',
          targetId: c.id,
          targetName: `#${c.name}`,
          description: `Channel "${c.name}" uses non-standard formatting.`,
          suggestion: 'Rename to lowercase-with-hyphens.',
        });
      }
    }
    return issues;
  }

  private detectCategoryClutter(categories: CategoryChannel[]): CleanupIssue[] {
    const issues: CleanupIssue[] = [];
    for (const cat of categories) {
      const count = cat.children.cache.size;
      if (count >= CLUTTERED_CATEGORY_THRESHOLD) {
        issues.push({
          kind: 'category-clutter',
          severity: 'warn',
          targetId: cat.id,
          targetName: cat.name,
          description: `Category "${cat.name}" has ${count} channels.`,
          suggestion: 'Split into multiple categories or archive unused channels.',
        });
      }
    }
    return issues;
  }

  private detectEmptyCategories(categories: CategoryChannel[]): CleanupIssue[] {
    const issues: CleanupIssue[] = [];
    for (const cat of categories) {
      if (cat.children.cache.size === EMPTY_CATEGORY_THRESHOLD) {
        issues.push({
          kind: 'empty-channel',
          severity: 'info',
          targetId: cat.id,
          targetName: cat.name,
          description: `Category "${cat.name}" is empty.`,
          suggestion: 'Delete the empty category.',
        });
      }
    }
    return issues;
  }

  private detectUnusedRoles(roles: Role[]): CleanupIssue[] {
    const issues: CleanupIssue[] = [];
    for (const role of roles) {
      if (role.id === this.guild.roles.everyone.id) continue;
      if (role.managed) continue;
      if (role.members.size === 0) {
        issues.push({
          kind: 'unused-role',
          severity: 'info',
          targetId: role.id,
          targetName: `@${role.name}`,
          description: `Role @${role.name} has 0 members.`,
          suggestion: 'Delete the role or assign it to someone.',
        });
      }
    }
    return issues;
  }

  private detectPermissionIssues(channels: GuildBasedChannel[]): CleanupIssue[] {
    const issues: CleanupIssue[] = [];
    for (const c of channels) {
      if (!('permissionOverwrites' in c)) continue;
      const everyoneOverwrite = c.permissionOverwrites.cache.get(this.guild.roles.everyone.id);
      if (everyoneOverwrite?.allow.has(PermissionFlagsBits.Administrator)) {
        issues.push({
          kind: 'permission-issue',
          severity: 'critical',
          targetId: c.id,
          targetName: c.name,
          description: `@everyone has Administrator on ${c.name}.`,
          suggestion: 'Remove the @everyone Administrator override immediately.',
        });
      }
    }
    return issues;
  }

  private detectInconsistentFormatting(channels: GuildBasedChannel[]): CleanupIssue[] {
    // Compare topic capitalization across text channels in the same category.
    const issues: CleanupIssue[] = [];
    const byParent = new Map<string, TextChannel[]>();
    for (const c of channels) {
      if (c.type !== ChannelType.GuildText) continue;
      const parent = c.parentId ?? 'root';
      const list = byParent.get(parent) ?? [];
      list.push(c as TextChannel);
      byParent.set(parent, list);
    }
    for (const [, list] of byParent) {
      const withTopic = list.filter((c) => !!c.topic);
      const without = list.length - withTopic.length;
      if (withTopic.length > 0 && without > 0 && without >= withTopic.length) {
        for (const c of list.filter((c) => !c.topic)) {
          issues.push({
            kind: 'inconsistent-formatting',
            severity: 'info',
            targetId: c.id,
            targetName: `#${c.name}`,
            description: `#${c.name} has no topic but siblings do.`,
            suggestion: 'Add a topic for consistency.',
          });
        }
      }
    }
    return issues;
  }

  private async detectDeadChannels(
    channels: GuildBasedChannel[],
    days: number,
  ): Promise<CleanupIssue[]> {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const issues: CleanupIssue[] = [];

    for (const c of channels) {
      if (c.type !== ChannelType.GuildText && c.type !== ChannelType.GuildAnnouncement) continue;
      const tc = c as TextChannel;

      try {
        const last = await tc.messages.fetch({ limit: 1 }).catch(() => null);
        const newest = last?.first();
        if (!newest) {
          issues.push({
            kind: 'empty-channel',
            severity: 'info',
            targetId: tc.id,
            targetName: `#${tc.name}`,
            description: `#${tc.name} has no messages.`,
            suggestion: 'Archive or delete.',
          });
          continue;
        }
        if (newest.createdTimestamp < cutoff) {
          issues.push({
            kind: 'dead-channel',
            severity: 'info',
            targetId: tc.id,
            targetName: `#${tc.name}`,
            description: `#${tc.name} last active ${Math.floor(
              (Date.now() - newest.createdTimestamp) / 86_400_000,
            )} days ago.`,
            suggestion: 'Archive the channel.',
          });
        }
      } catch (err) {
        logger.debug(`Could not inspect #${tc.name}: ${(err as Error).message}`);
      }
    }

    return issues;
  }

  // -------------------------------------------------------------------------
  // Apply
  // -------------------------------------------------------------------------

  private async applyIssue(
    issue: CleanupIssue,
    opts: ApplyOptions,
    out: CleanupApplyReport,
  ): Promise<void> {
    switch (issue.kind) {
      case 'unused-role': {
        if (!issue.targetId) return;
        const role = this.guild.roles.cache.get(issue.targetId);
        if (!role || role.managed) return;
        await role.delete('SwansonX cleanup: unused role');
        out.deletedRoles.push(role.name);
        break;
      }
      case 'bad-naming': {
        if (!issue.targetId) return;
        const ch = this.guild.channels.cache.get(issue.targetId);
        if (!ch) return;
        const newName = ch.name
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (!newName || newName === ch.name) return;
        await ch.setName(newName, 'SwansonX cleanup: normalize naming');
        out.renamedChannels.push({ from: ch.name, to: newName });
        break;
      }
      case 'dead-channel':
      case 'empty-channel': {
        if (!issue.targetId) return;
        const ch = this.guild.channels.cache.get(issue.targetId);
        if (!ch) return;
        if (opts.archiveOnly !== false) {
          const archivedName = ch.name.startsWith('archive-') ? ch.name : `archive-${ch.name}`;
          await ch.setName(archivedName.slice(0, 100), 'SwansonX cleanup: archive');
          out.archivedChannels.push(ch.name);
        } else {
          await ch.delete('SwansonX cleanup: delete dead/empty');
          out.archivedChannels.push(ch.name);
        }
        break;
      }
      default:
        // Other kinds are advisory-only by default.
        break;
    }
  }
}

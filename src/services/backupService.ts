import { ChannelType, type Guild } from 'discord.js';
import type { BackupChannel, BackupRole, GuildBackup } from '../types/wipe.js';

/**
 * Snapshots a guild's structural state to a JSON-serializable payload.
 * This is the rollback source for /server-wipe and the audit trail for
 * /server-clean.
 *
 * Note: this does NOT export messages or member data. It captures the
 * shape — roles, channels, permission overwrites — only.
 */
export class BackupService {
  constructor(private readonly guild: Guild) {}

  async snapshot(): Promise<GuildBackup> {
    await this.guild.channels.fetch();
    await this.guild.roles.fetch();

    const roles: BackupRole[] = this.guild.roles.cache.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      mentionable: r.mentionable,
      position: r.position,
      permissions: r.permissions.bitfield.toString(),
      managed: r.managed,
    }));

    const channels: BackupChannel[] = this.guild.channels.cache.map((c) => {
      const base: BackupChannel = {
        id: c.id,
        name: c.name,
        type: c.type,
        position: 'position' in c ? c.position : 0,
        parentId: c.parentId,
        permissionOverwrites:
          'permissionOverwrites' in c
            ? c.permissionOverwrites.cache.map((o) => ({
                id: o.id,
                type: o.type,
                allow: o.allow.bitfield.toString(),
                deny: o.deny.bitfield.toString(),
              }))
            : [],
      };
      if (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) {
        base.topic = c.topic;
        base.nsfw = c.nsfw;
        base.rateLimitPerUser = c.rateLimitPerUser ?? undefined;
      }
      return base;
    });

    return {
      guildId: this.guild.id,
      guildName: this.guild.name,
      exportedAt: new Date().toISOString(),
      roles,
      channels,
    };
  }
}

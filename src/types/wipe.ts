export interface WipeProtections {
  /** Channel ids/names to keep. */
  channelIds: Set<string>;
  channelNames: Set<string>;
  /** Role ids/names to keep. */
  roleIds: Set<string>;
  roleNames: Set<string>;
}

export interface WipePlan {
  guildId: string;
  guildName: string;
  willDelete: {
    categories: { id: string; name: string }[];
    textChannels: { id: string; name: string }[];
    voiceChannels: { id: string; name: string }[];
    forumChannels: { id: string; name: string }[];
    otherChannels: { id: string; name: string }[];
    roles: { id: string; name: string }[];
  };
  willKeep: {
    channels: { id: string; name: string; reason: string }[];
    roles: { id: string; name: string; reason: string }[];
  };
}

export interface WipeReport {
  deletedChannels: string[];
  deletedRoles: string[];
  errors: string[];
}

export interface GuildBackup {
  guildId: string;
  guildName: string;
  exportedAt: string;
  roles: BackupRole[];
  channels: BackupChannel[];
}

export interface BackupRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  mentionable: boolean;
  position: number;
  permissions: string;
  managed: boolean;
}

export interface BackupChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parentId: string | null;
  topic?: string | null;
  nsfw?: boolean;
  rateLimitPerUser?: number;
  permissionOverwrites: {
    id: string;
    type: number;
    allow: string;
    deny: string;
  }[];
}

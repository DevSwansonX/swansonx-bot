import type {
  ChatInputCommandInteraction,
  ClientEvents,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export type ChannelKind = 'text' | 'voice' | 'announcement' | 'forum' | 'stage';

export interface RoleSpec {
  name: string;
  color?: number | string;
  hoist?: boolean;
  mentionable?: boolean;
  permissions?: bigint[] | string[];
}

export interface EmbedSpec {
  title: string;
  description: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: string;
}

export interface ChannelSpec {
  name: string;
  kind: ChannelKind;
  topic?: string;
  nsfw?: boolean;
  slowmodeSeconds?: number;
  /** Embeds to post once the channel is created. */
  embeds?: EmbedSpec[];
  /** Plain-text welcome / pinned messages. */
  messages?: string[];
  /** Role names that can view this channel. Empty = everyone. */
  visibleTo?: string[];
}

export interface CategorySpec {
  name: string;
  channels: ChannelSpec[];
  /** Role names allowed to view all channels in this category. */
  visibleTo?: string[];
}

export interface OnboardingSpec {
  /** Channel name that receives the onboarding welcome embed. */
  channel: string;
  welcome: EmbedSpec;
  rules?: EmbedSpec;
}

export interface ServerTemplate {
  id: string;
  name: string;
  description: string;
  /** Optional new server name to apply to the guild. */
  serverName?: string;
  roles: RoleSpec[];
  categories: CategorySpec[];
  onboarding?: OnboardingSpec;
}

export interface BotCommand {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
}

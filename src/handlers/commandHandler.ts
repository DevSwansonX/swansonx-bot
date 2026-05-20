import { Collection, type Client } from 'discord.js';
import type { BotCommand } from '../types/template.js';
import { pingCommand } from '../commands/ping.js';
import { setupAiCommand } from '../commands/setup-ai.js';
import { logger } from '../utils/logger.js';

const ALL_COMMANDS: BotCommand[] = [pingCommand, setupAiCommand];

export type CommandCollection = Collection<string, BotCommand>;

export function loadCommands(client: Client & { commands?: CommandCollection }): CommandCollection {
  const collection: CommandCollection = new Collection();
  for (const cmd of ALL_COMMANDS) {
    collection.set(cmd.data.name, cmd);
    logger.debug(`Loaded command: /${cmd.data.name}`);
  }
  client.commands = collection;
  logger.info(`Registered ${collection.size} commands in-process`);
  return collection;
}

export function getCommandJSON(): unknown[] {
  return ALL_COMMANDS.map((c) => c.data.toJSON());
}
